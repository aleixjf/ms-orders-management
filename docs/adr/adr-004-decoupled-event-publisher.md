# ADR-004: Decoupled Event Publisher & Agnostic Messaging Infrastructure

## Context

Event publishing was directly coupled in application services, making the domain dependent on specific infrastructure implementations. This created tight coupling between business logic and messaging systems, making testing difficult and reducing flexibility.

Additionally, we needed a messaging infrastructure that allows easy switching between different messaging systems (Kafka, RabbitMQ, Redis, etc.) without modifying application code.

## Decision

Create an **Agnostic Messaging Infrastructure** with an Event Publisher as infrastructure adapter that transforms domain events to a messaging system of our choice.

### Architecture Layers

```text
src/
├── domain/shared/messaging/           # Pure domain interfaces
│   ├── event-publisher.interface.ts   # IDomainEventPublisher
│   ├── message-subscriber.interface.ts # IMessageSubscriber
│   └── index.ts
├── infrastructure/messaging/
│   ├── interfaces/                   # Infrastructure interfaces
│   │   ├── messaging-provider.interface.ts
│   │   ├── publisher.interface.ts
│   │   └── subscriber.interface.ts
│   ├── kafka/                        # Kafka implementation
│   │   ├── kafka.module.ts
│   │   ├── adapters/
│   │   └── providers/
│   ├── rabbitmq/                     # RabbitMQ implementation
│   │   └── providers/
│   ├── messaging-provider.factory.ts # Factory for providers
│   ├── messaging-config.service.ts   # Centralized configuration
│   └── messaging.module.ts          # Main agnostic module
```

### Core Implementation

#### 1. Domain Interfaces (Ports)

```typescript
// Pure domain interface
export interface IDomainEventPublisher {
  publish(event: IDomainEvent): Promise<void>;
  publishAll(events: IDomainEvent[]): Promise<void>;
  publishDomainEvents(aggregate: AggregateRoot): Promise<void>;
}

export interface IMessageSubscriber {
  subscribeToTopic(topic: string, handler: MessageHandler): Promise<void>;
  subscribeToPattern(pattern: string, handler: MessageHandler): Promise<void>;
}

export interface IDomainEvent {
  readonly aggregateId: string;
  readonly eventType: string;
  readonly occurredOn: Date;
  readonly payload: Record<string, unknown>;
}
```

#### 2. Infrastructure Interfaces (Adapters)

```typescript
export interface IMessagingProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(topic: string, message: IMessage): Promise<void>;
  subscribe(pattern: string, handler: Function): Promise<void>;
  getHealthInfo(): Promise<IHealthInfo>;
}

export interface IMessage {
  key?: string;
  value: any;
  headers?: Record<string, string>;
  timestamp?: Date;
}
```

#### 3. Messaging Module Configuration

```typescript
// Main agnostic module
@Module({
  imports: [MessagingModule],
  // ...
})
export class YourModule {}

// Dynamic configuration
MessagingModule.forRoot({
  provider: 'kafka', // or 'rabbitmq', 'redis', 'inmemory'
  config: {
    brokers: ['localhost:9092'],
    clientId: 'order-service',
    groupId: 'order-group'
  }
})
```

#### 4. Provider Implementations

```typescript
// Kafka Provider
@Injectable()
export class KafkaMessagingProvider implements IMessagingProvider {
  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka
  ) {}

  async publish(topic: string, message: IMessage): Promise<void> {
    await this.kafka.emit(topic, {
      key: message.key,
      value: message.value,
      headers: message.headers
    });
  }

  async getHealthInfo(): Promise<IHealthInfo> {
    return {
      isHealthy: true,
      details: { provider: 'kafka', status: 'connected' }
    };
  }
}

// RabbitMQ Provider (Alternative)
@Injectable()
export class RabbitMQMessagingProvider implements IMessagingProvider {
  // Implementation for RabbitMQ...
}
```

#### 5. Domain Event Publisher Adapter

```typescript
@Injectable()
export class DomainEventPublisher implements IDomainEventPublisher {
  constructor(
    @Inject('IMessagingProvider')
    private readonly messagingProvider: IMessagingProvider
  ) {}

  async publish(event: IDomainEvent): Promise<void> {
    await this.messagingProvider.publish(
      event.eventType,
      this.transformToMessage(event)
    );
  }

  async publishDomainEvents(aggregate: AggregateRoot): Promise<void> {
    const events = aggregate.getDomainEvents();
    await Promise.all(events.map(event => this.publish(event)));
    aggregate.clearDomainEvents();
  }

  private transformToMessage(event: IDomainEvent): IMessage {
    return {
      key: event.aggregateId,
      value: {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        occurredOn: event.occurredOn,
        payload: event.payload
      },
      headers: {
        'event-type': event.eventType,
        'aggregate-id': event.aggregateId
      }
    };
  }
}
```

### 6. Usage Examples

#### Publishing Domain Events

```typescript
@Injectable()
export class OrderDomainService {
  constructor(
    @Inject('IDomainEventPublisher')
    private eventPublisher: IDomainEventPublisher,
    @Inject('IOrderRepository')
    private orderRepository: IOrderRepository
  ) {}

  async createOrder(command: CreateOrderCommand): Promise<void> {
    const order = Order.create(command);

    // Save aggregate
    await this.orderRepository.save(order);

    // Publish domain events automatically
    await this.eventPublisher.publishDomainEvents(order);
  }
}
```

#### Consuming Events

```typescript
@Injectable()
export class OrderEventHandler {
  @EventPattern('order.created')
  async handleOrderCreated(@Payload() event: OrderCreatedEvent): Promise<void> {
    console.log('Order created:', event.orderId);
    // Process the event...
  }

  @EventPattern('order.confirmed')
  async handleOrderConfirmed(@Payload() event: OrderConfirmedEvent): Promise<void> {
    // Send confirmation email, update inventory, etc.
  }
}
```

#### Domain Event Integration

```typescript
export class Order extends AggregateRoot {
  private domainEvents: DomainEvent[] = [];

  static create(customerId: CustomerId, products: Product[]): Order {
    const order = new Order(/* ... */);
    order.addDomainEvent(new OrderCreatedEvent(order.id.value));
    return order;
  }

  confirm(): void {
    if (!this.canTransitionTo(OrderStatus.CONFIRMED)) {
      throw new InvalidOrderStatusTransitionError();
    }

    this.status = OrderStatus.CONFIRMED;
    this.addDomainEvent(new OrderConfirmedEvent(this.id.value));
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
```

### 7. Available Providers

#### Kafka Provider ✅

- Full-featured Kafka integration with NestJS
- Support for producers and consumers
- Dead letter queue (DLQ) support
- Error handling and retry mechanisms

```typescript
MessagingModule.forRoot({
  provider: 'kafka',
  config: {
    brokers: ['localhost:9092'],
    clientId: 'order-service',
    groupId: 'order-group'
  }
})
```

#### RabbitMQ Provider 🚧

- RabbitMQ integration with exchanges and queues
- Support for different exchange types
- Message acknowledgment and error handling

#### Redis Provider 📋

- Redis pub/sub implementation
- Support for channels and patterns
- Lightweight for simple messaging needs

#### In-Memory Provider ✅

- For testing and development
- No external dependencies
- Synchronous event processing

### 8. Error Handling & Resilience

The infrastructure includes comprehensive error handling:

```typescript
@Injectable()
export class ResilientMessagingProvider implements IMessagingProvider {
  constructor(
    private readonly baseProvider: IMessagingProvider,
    private readonly circuitBreaker: CircuitBreaker,
    private readonly retryPolicy: RetryPolicy
  ) {}

  async publish(topic: string, message: IMessage): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return this.retryPolicy.execute(async () => {
        await this.baseProvider.publish(topic, message);
      });
    });
  }
}
```

- **Retry Mechanisms**: Automatic retry for transient failures
- **Dead Letter Queues**: Failed messages are sent to DLQ for investigation
- **Circuit Breakers**: Protection against cascading failures
- **Logging**: Comprehensive logging for monitoring and debugging

### 9. Configuration Management

```typescript
@Injectable()
export class MessagingConfigService {
  getKafkaConfig(): IKafkaConfig {
    return {
      brokers: this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
      clientId: this.configService.get('KAFKA_CLIENT_ID', 'order-service'),
      groupId: this.configService.get('KAFKA_GROUP_ID', 'order-group')
    };
  }

  getRabbitMQConfig(): IRabbitMQConfig {
    return {
      url: this.configService.get('RABBITMQ_URL', 'amqp://localhost:5672'),
      exchange: this.configService.get('RABBITMQ_EXCHANGE', 'orders')
    };
  }
}
```

Environment variables:

```bash
# Kafka Configuration
MESSAGING_PROVIDER=kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=order-service
KAFKA_GROUP_ID=order-group

# RabbitMQ Configuration
MESSAGING_PROVIDER=rabbitmq
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=orders

# Redis Configuration
MESSAGING_PROVIDER=redis
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=orders
```

### 10. Testing Strategies

#### Unit Testing

```typescript
describe('OrderDomainService', () => {
  let service: OrderDomainService;
  let mockEventPublisher: jest.Mocked<IDomainEventPublisher>;

  beforeEach(() => {
    mockEventPublisher = {
      publish: jest.fn(),
      publishAll: jest.fn(),
      publishDomainEvents: jest.fn(),
    };

    service = new OrderDomainService(mockRepository, mockEventPublisher);
  });

  it('should publish domain events when creating order', async () => {
    await service.createOrder(command);

    expect(mockEventPublisher.publishDomainEvents).toHaveBeenCalled();
  });
});
```

#### Integration Testing

```typescript
describe('Messaging Integration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        MessagingModule.forRoot({
          provider: 'inmemory', // Use in-memory for testing
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should publish and consume events', async () => {
    // Test event flow
  });
});
```

## Consequences

### Positive

- ✅ **Domain Independence**: Domain completely decoupled from infrastructure
- ✅ **Centralized Logic**: Event publishing logic centralized and reusable
- ✅ **Easy Testing**: Domain services can be tested with mock publishers
- ✅ **Flexibility**: Easy switch between Kafka, RabbitMQ, Redis, or in-memory implementations
- ✅ **Clean Architecture**: Clear separation of concerns
- ✅ **Error Handling**: Better error handling and retry mechanisms
- ✅ **Multiple Providers**: Support for multiple messaging providers
- ✅ **Type Safety**: Full TypeScript integration with interfaces
- ✅ **Testability**: Clean interfaces allow easy mocking
- ✅ **Maintainability**: Clear separation of responsibilities
- ✅ **Scalability**: Easy to add new providers
- ✅ **SOLID Principles**: Follows all design principles

### Negative

- ❌ **Additional Complexity**: More abstraction layers in the infrastructure
- ❌ **Learning Curve**: More abstraction layers to understand
- ❌ **Initial Setup**: Initial setup overhead
- ❌ **Configuration**: More configuration required for multiple providers

### Risks Mitigated

- **Vendor Lock-in**: Easy switching between messaging providers
- **Testing Complexity**: Simplified testing with mock interfaces
- **Maintenance**: Centralized messaging logic reduces duplication
- **Scalability**: Provider pattern supports horizontal scaling

## Implementation Status

### ✅ Completed Tasks

#### 1. Agnostic Messaging Architecture

- **Domain Interfaces**: Created pure interfaces in `src/domain/shared/messaging/`
- **Infrastructure Interfaces**: Implemented interfaces in `src/infrastructure/messaging/interfaces/`
- **Factory Pattern**: Implemented factory to dynamically instantiate different providers

#### 2. Dependency Injection Resolution

- **KafkaModule**: Fixed to correctly export `ClientsModule` and make `KAFKA_CLIENT` available
- **MessagingModule**: Refactored to avoid circular references and use correct providers
- **OrdersModule**: Updated to import `KafkaModule` directly when needing access to Kafka client

#### 3. Provider Implementations

- **Kafka Provider**: Enhanced `KafkaMessagingProvider` with error handling and robust configuration
- **RabbitMQ Provider**: Implemented `RabbitMQMessagingProvider` as alternative example
- **Adapters**: Updated all adapters to use correct dependency injection

#### 4. DDD/Hexagonal Principles

- **Separation of Concerns**: Domain completely independent of infrastructure
- **Dependency Inversion**: Correct use of interfaces and dependency injection
- **Port/Adapter**: Clear implementation of hexagonal pattern

### ✅ Operation Verification

#### Compilation Status

- ✅ **TypeScript**: No compilation errors
- ✅ **Linting**: Code formatted and no warnings
- ✅ **Imports**: Correctly ordered

#### Dependency Injection Status

- ✅ **KafkaModule**: Correctly exports `ClientsModule` and providers
- ✅ **MessagingModule**: Resolves all dependencies without circular references
- ✅ **OrdersModule**: Can access `KAFKA_CLIENT` correctly
- ✅ **Startup**: Application starts all modules without DI errors

#### Bootstrapping Status

```text
[Nest] LOG [InstanceLoader] KafkaModule dependencies initialized
[Nest] LOG [InstanceLoader] MessagingModule dependencies initialized
[Nest] LOG [InstanceLoader] OrdersModule dependencies initialized
```

## Provider Switching

### Switch from Kafka to RabbitMQ

```typescript
// In messaging.module.ts, change:
{
    provide: MESSAGING_PROVIDER,
    useClass: RabbitMQMessagingProvider, // Instead of KafkaMessagingProvider
}
```

### Add New Provider

1. Implement `IMessagingProvider` interface
2. Create new specific module (e.g., `RedisModule`)
3. Register in factory or use directly in `MessagingModule`

## Migration Guide

To migrate from direct Kafka usage to the agnostic infrastructure:

1. Replace direct Kafka imports with messaging interfaces
2. Update module configuration to use MessagingModule
3. Inject IDomainEventPublisher instead of Kafka client
4. Update event handlers to use messaging decorators
5. Test with different providers to ensure compatibility

## Future Enhancements

### Recommended Next Steps

1. **Enhanced Testing**: Add comprehensive unit tests for all providers
2. **Dynamic Configuration**: Make provider selection configurable via environment
3. **Monitoring & Metrics**: Add metrics and logging for each provider
4. **Advanced Resilience**: Implement retry policies and circuit breakers
5. **Schema Validation**: Support for message schema validation
6. **Message Transformation**: Advanced routing and transformation capabilities
7. **Transactional Messaging**: Support for transactional outbox pattern
8. **Deduplication**: Message deduplication and idempotency support

## Related ADRs

- [ADR-001: DDD Architecture](./adr-001-ddd-architecture.md)
- [ADR-003: Data Validation with Class-Transformer and Class-Validator](./adr-003-data-validation.md)

## Alternatives Considered

1. **Direct Kafka Integration**: Less flexible, tightly coupled
2. **Event Sourcing**: More complex, not needed for current requirements
3. **Azure Service Bus**: Cloud-specific, less control
4. **AWS SQS/SNS**: Cloud-specific, vendor lock-in

## References

- [Domain Events Pattern](https://martinfowler.com/eaaDev/DomainEvent.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
