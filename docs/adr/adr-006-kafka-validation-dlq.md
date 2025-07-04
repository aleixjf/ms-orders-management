# ADR-006: Kafka Consumer Validation and Dead Letter Queue Implementation

## Status

Accepted

## Context

In our hybrid NestJS microservice architecture (HTTP + gRPC + Kafka), we need to handle invalid Kafka message payloads without causing consumer crashes or infinite restart loops. The challenge is that validation errors in Kafka consumers can cause the entire consumer to restart repeatedly, leading to:

- **Infinite Loops**: Invalid messages cause consumer restarts until crash
- **Service Downtime**: Consumer crashes affect message processing entirely
- **Message Loss**: Invalid messages may be lost without proper handling
- **Resource Waste**: Constant restarts consume unnecessary resources

> **⚠️ Fundamental for Hybrid Applications**: Global pipes (`APP_PIPE`) and global filters (`APP_FILTER`) **CANNOT** be used in hybrid NestJS applications that combine HTTP, gRPC, and Kafka. Comments in `src/main.ts` explain these limitations in detail.

## Decision

We implement a comprehensive Dead Letter Queue (DLQ) solution with manual validation for Kafka consumers to prevent infinite loops and ensure message preservation.

### 1. Kafka Consumer Configuration

**Kafka Configuration in `main.ts`:**

```typescript
// ✅ Correct configuration to prevent infinite loops
app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
        consumer: {
            retry: {
                retries: 0,        // ✅ No automatic retries
                restartOnFailure: async (error) => {
                    logger.error("Critical error in Kafka consumer, preventing restart...", {
                        context: "KafkaConsumer",
                        error,
                    });
                    return false;  // ✅ Never restart - let filters handle errors
                },
            },
        },
    },
});
```

### 2. KafkaExceptionFilter Implementation

**Location:** `src/infrastructure/messaging/kafka/kafka.filter.ts`

```typescript
@Catch() // Captures ALL exceptions
export class KafkaExceptionFilter implements ExceptionFilter {
    constructor(
        private readonly logger: Logger,
        private readonly kafkaService: KafkaService
    ) {}

    catch(exception: Error, host: ArgumentsHost): void {
        // Only act on Kafka/RPC contexts
        if (host.getType() !== 'rpc') {
            throw exception; // Re-throw for other contexts
        }

        const ctx = host.switchToRpc();
        const message = ctx.getData();
        const context = ctx.getContext();

        // Extract Kafka message details
        const { topic, partition, offset, headers, key } = context;

        // Handle validation errors specially
        if (exception instanceof ValidationFailedError) {
            this.logger.error(`Kafka validation error in topic ${topic}`, {
                topic,
                partition,
                offset,
                error: exception.message,
                validationErrors: exception.getResponse(),
                payload: message
            });
        } else {
            this.logger.error(`Kafka consumer error in topic ${topic}`, {
                topic,
                partition,
                offset,
                error: exception.message,
                stack: exception.stack,
                payload: message
            });
        }

        // Send to DLQ with complete metadata
        this.sendToDLQ({
            data: message,
            error: exception.message,
            originalTopic: topic,
            originalPartition: partition,
            originalOffset: offset,
            originalHeaders: headers,
            originalKey: key,
            timestamp: new Date().toISOString()
        });

        // ✅ CRITICAL: Do NOT re-throw exception to prevent infinite loops
        // Kafka will commit the offset and continue processing
    }

    private async sendToDLQ(dlqPayload: any): Promise<void> {
        const dlqTopic = `${dlqPayload.originalTopic}.dlq`;
        // Send to DLQ topic implementation
        await this.kafkaService.emit(dlqTopic, dlqPayload);
    }
}
```

### 3. GlobalValidationPipe for Kafka

**Location:** `src/shared/pipes/global-validation.pipe.ts`

```typescript
@Injectable()
export class GlobalValidationPipe extends ValidationPipe {
    constructor() {
        super({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            exceptionFactory: (errors: ValidationError[] = []) => {
                return new ValidationFailedError(errors);
            },
        });
    }
}
```

### 4. Correct Module Configuration

> **⚠️ Critical**: DO NOT register `KafkaExceptionFilter` or `GlobalValidationPipe` as global providers (`APP_FILTER`, `APP_PIPE`). In hybrid NestJS applications, global providers do not work reliably. See comments in `src/main.ts`.

**Correct Configuration:**

```typescript
// ✅ Correct: Controller-level decorators
@Controller("orders")
@UsePipes(GlobalValidationPipe)      // ✅ Validates all controller payloads
@UseFilters(KafkaExceptionFilter)    // ✅ Captures all controller errors
export class OrdersKafkaConsumer {
    @EventPattern('order.created')
    async handleOrderCreated(@Payload() data: OrderCreatedEventDto) {
        // Manual validation already handled by pipe
        await this.orderService.processOrderCreated(data);
    }
}

// ❌ INCORRECT: Do not use global providers in hybrid apps
/*
// In AppModule or any module:
providers: [
  {
    provide: APP_PIPE,           // ❌ Does NOT work in hybrid apps
    useClass: GlobalValidationPipe
  },
  {
    provide: APP_FILTER,         // ❌ Does NOT work in hybrid apps
    useClass: KafkaExceptionFilter
  }
]
*/

// ❌ INCORRECT: Do not use in main.ts for hybrid applications
/*
// From src/main.ts - explanatory comments:
// ! Global filters can't be used for gateways or in hybrid applications (microservices included)
// To use them, we'll have to add them to each controller with the @UseFilters() decorator.
app.useGlobalFilters(new KafkaExceptionFilter());
app.useGlobalPipes(new GlobalValidationPipe());
*/
```

### 5. Manual Validation Alternative

For consumers that require more control, manual validation can be implemented:

```typescript
@Controller("orders")
@UseFilters(KafkaExceptionFilter)
export class OrdersKafkaConsumer {

    @EventPattern(OrdersPatterns.CREATE)
    createOrder(
        @Payload() data: CreateOrderCommand,
        @Ctx() context: KafkaContext
    ): Observable<OrderDTO> {
        const topic = context.getTopic();
        this.logger.debug(`[${topic}] Creating order`, data);

        try {
            const transformed = plainToClass(CreateOrderCommand, data);
            return from(validate(transformed)).pipe(
                switchMap((errors) => {
                    if (errors.length > 0)
                        return this.handleValidationError(context, errors);
                    return this.orderAppService.createOrder(data).pipe(
                        tap((dto) => {
                            this.logger.debug(
                                `[${topic}] Order created successfully: ${dto.id}`
                            );
                        })
                    );
                }),
                catchError((error) => {
                    this.logger.error(
                        `[${topic}] Validation failed, sending to DLQ`
                    );
                    return this.kafkaClient.emit(`${topic}.dlq`, {
                        data: context.getMessage(),
                        error,
                    });
                })
            );
        } catch (error) {
            this.logger.error(`[${topic}] Invalid data, sending to DLQ`);
            return this.kafkaClient.emit(`${topic}.dlq`, {
                data: context.getMessage(),
                error: new TransformationFailedError(error),
            });
        }
    }
}
```

## Error Handling Flow

1. **Invalid Kafka message arrives** → Kafka Consumer
2. **GlobalValidationPipe validates** → Throws `ValidationFailedError` if validation fails
3. **KafkaExceptionFilter captures** → RPC/Kafka context detected
4. **Detailed logging** → Includes validation information and message metadata
5. **Send to DLQ** → `{topic}.dlq` with complete metadata
6. **NO exception re-throw** → Kafka commits offset automatically
7. **Consumer continues** → Processes next message without restart

## DLQ Payload Format

```json
{
  "data": "original payload",
  "error": "Validation failed: [detailed errors]",
  "originalTopic": "orders.create",
  "originalPartition": 0,
  "originalOffset": 10,
  "originalHeaders": {},
  "originalKey": null,
  "timestamp": "2025-07-04T10:30:00.000Z"
}
```

## Benefits

### ✅ No Infinite Loops

- Invalid messages are processed once and marked as completed
- Consumer never restarts due to validation errors

### ✅ Service Continuity

- One invalid message does not affect processing of other messages
- Consumer remains active and healthy

### ✅ Complete Traceability

- Detailed logs for debugging
- DLQ with complete metadata for later analysis

### ✅ Optimized Configuration

- No unnecessary automatic retries
- More efficient and stable consumer

## Testing Recommendations

1. **Send invalid payload** → Verify it goes to DLQ without restarting consumer
2. **Send valid payload after** → Verify it processes normally
3. **Monitor logs** → Verify no "restart" or "crash" errors
4. **Monitor DLQ topics** → Verify invalid messages arrive correctly

## Monitoring and Alerting

### Recommended Metrics

- DLQ message count per topic
- Consumer lag per partition
- Validation error rates
- Consumer restart count (should be zero)

### Alerting Thresholds

- Alert when DLQ receives > 10 messages/minute
- Alert when consumer lag > 1000 messages
- Alert on any consumer restart

## Future Enhancements

1. **DLQ Processing**: Implement retry mechanisms for recoverable errors
2. **Automated Analysis**: Tools to analyze DLQ patterns and common errors
3. **Dashboard**: Real-time monitoring of DLQ status and consumer health
4. **Backoff Strategy**: Exponential backoff for retryable error types

This solution guarantees that there will **NEVER** be infinite loops due to validation errors in Kafka, keeping the service stable and all errors properly logged and processed.

## References

- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Dead Letter Queue Pattern](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
