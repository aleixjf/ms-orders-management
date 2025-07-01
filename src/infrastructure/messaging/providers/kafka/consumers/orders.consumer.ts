import {Controller, Inject, Logger, UseFilters} from "@nestjs/common";
import {
    ClientKafka,
    Ctx,
    EventPattern,
    KafkaContext,
    Payload,
} from "@nestjs/microservices";

import {from, Observable} from "rxjs";
import {catchError, switchMap, tap} from "rxjs/operators";

import {plainToClass} from "class-transformer";
import {validate, ValidationError} from "class-validator";

import {OrderDTO} from "@application/orders/dtos/order.dto";
import {type DLQPayload} from "@infrastructure/messaging/providers/kafka/interfaces/dlq.interface";

import {OrdersAppService} from "@application/orders/services/orders.application.service";

import {
    CancelOrderCommand,
    ConfirmOrderCommand,
    CreateOrderCommand,
    DeliverOrderCommand,
    ShipOrderCommand,
} from "@application/orders/commands";
import {OrdersPatterns} from "@domain/orders/events/patterns/orders.patterns";
import {StockPatterns} from "@domain/orders/events/patterns/stock.patterns";
import {TransformationFailedError} from "@domain/shared/errors/transformation-failed.error";
import {ValidationFailedError} from "@domain/shared/errors/validation-failed.error";
import {KafkaExceptionFilter} from "@infrastructure/messaging/providers/kafka/kafka.filter";

@Controller("orders")
// @UsePipes(ValidationPipe) // ! We can't use a validation pipe because it emits an error that is propagated to Kafka and causes the consumer to crash and restart
@UseFilters(KafkaExceptionFilter)
export class OrdersKafkaConsumer {
    private readonly logger = new Logger(OrdersKafkaConsumer.name);

    constructor(
        private readonly orderAppService: OrdersAppService,
        @Inject("KAFKA_CLIENT") private readonly kafkaClient: ClientKafka
    ) {}

    private handleDeadLetterQueue(
        @Payload() data: DLQPayload,
        @Ctx() context: KafkaContext
    ): void {
        const topic = context.getTopic();
        // TODO: Handle as needed, e.g., send to an alerting system or log to a central logging service
    }

    private handleValidationError(
        context: KafkaContext,
        errors: ValidationError[]
    ): Observable<any> {
        const topic = context.getTopic();
        this.logger.error(
            `[${topic}] Validation failed for message, sending to DLQ`
        );
        return this.kafkaClient.emit(`${topic}.dlq`, {
            data: context.getMessage(),
            error: new ValidationFailedError(errors),
        });
    }

    // ! Only ASCII alphanumerics, '.', '_', and '-' are allowed in topic names in Kafka
    // ? We must create a dead letter queue (DLQ) for handling messages that fail processing for every event, we can't use a single DLQ for all events
    /*
    @EventPattern("orders.*.dlq")
    handleDeadLetterQueue(
        @Payload() data: DLQPayload,
        @Ctx() context: KafkaContext
    ): void {
        return this.handleDeadLetterQueue(data, context);
    }
    */

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

    @EventPattern(`${OrdersPatterns.CREATE}.dlq`)
    createOrderDLQ(
        @Payload() data: DLQPayload,
        @Ctx() context: KafkaContext
    ): void {
        return this.handleDeadLetterQueue(data, context);
    }

    @EventPattern(OrdersPatterns.CONFIRM)
    confirmOrder(
        @Payload() data: ConfirmOrderCommand,
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.debug(`[${topic}] Confirming order`, data);

        try {
            const transformed = plainToClass(ConfirmOrderCommand, data);
            return from(validate(transformed)).pipe(
                switchMap((errors) => {
                    if (errors.length > 0)
                        return this.handleValidationError(context, errors);
                    return this.orderAppService.reserveOrder(data.id).pipe(
                        tap(() => {
                            this.logger.debug(
                                `[${topic}] Order ${data.id} reserved.`
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

    @EventPattern(`${OrdersPatterns.CONFIRM}.dlq`)
    confirmOrderDLQ(
        @Payload() data: DLQPayload,
        @Ctx() context: KafkaContext
    ): void {
        return this.handleDeadLetterQueue(data, context);
    }

    @EventPattern(OrdersPatterns.CANCEL)
    cancelOrder(
        @Payload() data: CancelOrderCommand,
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.debug(`[${topic}] Cancelling order`, data);

        try {
            const transformed = plainToClass(CancelOrderCommand, data);
            return from(validate(transformed)).pipe(
                switchMap((errors) => {
                    if (errors.length > 0)
                        return this.handleValidationError(context, errors);
                    return this.orderAppService.cancelOrder(data.id).pipe(
                        tap(() => {
                            this.logger.debug(
                                `[${topic}] Order ${data.id} cancelled.`
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

    @EventPattern(`${OrdersPatterns.CANCEL}.dlq`)
    cancelOrderDLQ(
        @Payload() data: DLQPayload,
        @Ctx() context: KafkaContext
    ): void {
        return this.handleDeadLetterQueue(data, context);
    }

    @EventPattern(OrdersPatterns.SHIP)
    shipOrder(
        @Payload() data: ShipOrderCommand,
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.debug(`[${topic}] Shipping order`, data);

        try {
            const transformed = plainToClass(ShipOrderCommand, data);
            return from(validate(transformed)).pipe(
                switchMap((errors) => {
                    if (errors.length > 0)
                        return this.handleValidationError(context, errors);
                    return this.orderAppService.shipOrder(data.id).pipe(
                        tap(() => {
                            this.logger.debug(
                                `[${topic}] Order ${data.id} shipped.`
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

    @EventPattern(`${OrdersPatterns.SHIP}.dlq`)
    shipOrderDLQ(
        @Payload() data: DLQPayload,
        @Ctx() context: KafkaContext
    ): void {
        return this.handleDeadLetterQueue(data, context);
    }

    @EventPattern(OrdersPatterns.DELIVER)
    deliverOrder(
        @Payload() data: DeliverOrderCommand,
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.debug(`[${topic}] Delivering order`, data);

        try {
            const transformed = plainToClass(DeliverOrderCommand, data);
            return from(validate(transformed)).pipe(
                switchMap((errors) => {
                    if (errors.length > 0)
                        return this.handleValidationError(context, errors);
                    return this.orderAppService.deliverOrder(data.id).pipe(
                        tap(() => {
                            this.logger.debug(
                                `[${topic}] Order ${data.id} delivered.`
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

    @EventPattern(`${OrdersPatterns.DELIVER}.dlq`)
    deliverOrderDLQ(
        @Payload() data: DLQPayload,
        @Ctx() context: KafkaContext
    ): void {
        return this.handleDeadLetterQueue(data, context);
    }

    @EventPattern(StockPatterns.RESERVED)
    stockReserved(
        @Payload() data: ConfirmOrderCommand,
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.debug(`[${topic}] Stock reserved event received`, data);

        try {
            const transformed = plainToClass(ConfirmOrderCommand, data);
            return from(validate(transformed)).pipe(
                switchMap((errors) => {
                    if (errors.length > 0)
                        return this.handleValidationError(context, errors);
                    return this.orderAppService.confirmOrder(data.id).pipe(
                        tap(() => {
                            this.logger.debug(
                                `[${topic}] Order ${data.id} confirmed.`
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

    @EventPattern(`${StockPatterns.RESERVED}.dlq`)
    stockReservedDLQ(
        @Payload() data: DLQPayload,
        @Ctx() context: KafkaContext
    ): void {
        return this.handleDeadLetterQueue(data, context);
    }

    @EventPattern(StockPatterns.REJECTED)
    stockRejected(
        @Payload() data: CancelOrderCommand,
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.debug(`[${topic}] Stock rejected event received`, data);

        try {
            const transformed = plainToClass(CancelOrderCommand, data);
            return from(validate(transformed)).pipe(
                switchMap((errors) => {
                    if (errors.length > 0)
                        return this.handleValidationError(context, errors);
                    return this.orderAppService.cancelOrder(data.id).pipe(
                        tap(() => {
                            this.logger.debug(
                                `[${topic}] Order ${data.id} confirmed.`
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

    @EventPattern(`${StockPatterns.REJECTED}.dlq`)
    stockRejectedDLQ(
        @Payload() data: DLQPayload,
        @Ctx() context: KafkaContext
    ): void {
        return this.handleDeadLetterQueue(data, context);
    }
}
