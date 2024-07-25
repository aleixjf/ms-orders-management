import {Controller, Inject, Logger, ValidationPipe} from "@nestjs/common";
import {
    ClientKafka,
    Ctx,
    KafkaContext,
    MessagePattern,
    Payload,
} from "@nestjs/microservices";

import {catchError, from, map, Observable, switchMap, throwError} from "rxjs";

import {plainToClass} from "class-transformer";
import {validate} from "class-validator";
import {v4} from "uuid";

import {OrderStatus} from "@enums/order-status.enum";

import {CreateOrderRequestDTO} from "@modules/orders/dtos/create-order.request.dto";
import {OrderDTO} from "@modules/orders/dtos/order.dto";

import {OrdersService} from "@modules/orders/orders.service";

@Controller("orders")
export class OrdersEvents {
    private readonly logger = new Logger(OrdersEvents.name);
    private readonly validationPipe = new ValidationPipe({transform: true});

    constructor(
        private ordersService: OrdersService,
        @Inject("KAFKA_CLIENT") private readonly client: ClientKafka
    ) {}

    @MessagePattern("orders.create")
    createOrder(
        @Payload() data: CreateOrderRequestDTO,
        @Ctx() context: KafkaContext
    ): Observable<OrderDTO> {
        const topic = context.getTopic();
        this.logger.debug("Creating order", {data, topic});

        const transformed = plainToClass(CreateOrderRequestDTO, data);

        return from(validate(transformed)).pipe(
            map((errors) => {
                if (errors.length > 0) {
                    throw new Error(
                        `Validation failed:\n${errors
                            .map(
                                (error) =>
                                    `${error.property}: ${error.value || "undefined"}\n${Object.values(error.constraints)}\n`
                            )
                            .join("\n")}`
                    );
                }
                return transformed;
            }),
            switchMap((data) => {
                const order = new OrderDTO({
                    id: v4(),
                    status: OrderStatus.PENDING,
                    ...data,
                });
                return this.ordersService.createOrder(order);
            }),
            catchError((error) => {
                this.client.emit(`${topic}.dlq`, {data, error});
                return throwError(() => error);
            })
        );
    }

    @MessagePattern("orders.create.dlq")
    createOrderError(
        @Payload() data: {data: any; error: any},
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.warn(
            `Topic ${topic}: An error happenned during order creation`,
            data.data,
            data.error
        );
        // ? Notify about the unprocessed message
        return;
    }

    @MessagePattern("orders.update")
    updateOrder(
        @Payload() data: OrderDTO,
        @Ctx() context: KafkaContext
    ): Observable<OrderDTO> {
        const topic = context.getTopic();
        this.logger.debug("Updating order", {data, topic});

        const transformed = plainToClass(OrderDTO, data);

        return from(validate(transformed)).pipe(
            map((errors) => {
                if (errors.length > 0) {
                    throw new Error(
                        `Validation failed:\n${errors
                            .map(
                                (error) =>
                                    `${error.property}: ${error.value || "undefined"}\n${Object.values(error.constraints)}\n`
                            )
                            .join("\n")}`
                    );
                }
                return transformed;
            }),
            switchMap((data) => this.ordersService.updateOrder(data.id, data)),
            catchError((error) => {
                this.client.emit(`${topic}.dlq`, {data, error});
                return throwError(() => error);
            })
        );
    }

    @MessagePattern("orders.update.dlq")
    updateOrderError(
        @Payload() data: {data: any; error: any},
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.warn(
            `Topic ${topic}: An error happenned during order update`,
            data.data,
            data.error
        );
        // ? Notify about the unprocessed message
        return;
    }

    @MessagePattern("orders.delete")
    deleteOrder(
        @Payload() data: {id: string},
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.debug("Deleting order", {data, topic});

        return this.ordersService.deleteOrder(data.id).pipe(
            catchError((error) => {
                this.client.emit(`${topic}.dlq`, {data, error});
                return throwError(() => error);
            })
        );
    }

    @MessagePattern("orders.delete.dlq")
    deleteOrderError(
        @Payload() data: {data: any; error: any},
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.warn(
            `Topic ${topic}: An error happenned during order deletion`,
            data.data,
            data.error
        );
        // ? Notify about the unprocessed message
        return;
    }

    @MessagePattern("orders.confirm")
    confirmOrder(
        @Payload() data: {id: string},
        @Ctx() context: KafkaContext
    ): Observable<OrderDTO> {
        const topic = context.getTopic();
        this.logger.debug("Confirming order", {data, topic});

        return this.ordersService.confirmOrder(data.id).pipe(
            catchError((error) => {
                this.client.emit(`${topic}.dlq`, {data, error});
                return throwError(() => error);
            })
        );
    }

    @MessagePattern("orders.cancel")
    cancelOrder(
        @Payload() data: {id: string},
        @Ctx() context: KafkaContext
    ): Observable<OrderDTO> {
        const topic = context.getTopic();
        this.logger.debug("Canceling order", {data, topic});

        return this.ordersService.cancelOrder(data.id).pipe(
            catchError((error) => {
                this.client.emit(`${topic}.dlq`, {data, error});
                return throwError(() => error);
            })
        );
    }

    @MessagePattern("orders.cancel.dlq")
    cancelOrderError(
        @Payload() data: {data: any; error: any},
        @Ctx() context: KafkaContext
    ): Observable<void> {
        const topic = context.getTopic();
        this.logger.warn(
            `Topic ${topic}: An error happenned during order cancellation`,
            data.data,
            data.error
        );
        // ? Notify about the unprocessed message
        return;
    }

    @MessagePattern("stock.reserved")
    stockReserved(
        @Payload() data: {orderId: string},
        @Ctx() context: KafkaContext
    ): Observable<OrderDTO> {
        this.logger.debug("Stock reserved event received", data);
        return this.ordersService.processOrder(data.orderId, {success: true});
    }

    @MessagePattern("stock.rejected")
    stockRejected(
        @Payload() data: {orderId: string; reason?: string},
        @Ctx() context: KafkaContext
    ): Observable<OrderDTO> {
        this.logger.debug("Stock rejected event received", data);
        return this.ordersService.processOrder(data.orderId, {
            success: false,
            reason: data.reason || "Not enough stock for all ordered products",
        });
    }
}
