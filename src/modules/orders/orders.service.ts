import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    OnModuleDestroy,
} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {ClientKafka} from "@nestjs/microservices";
import {InjectRepository} from "@nestjs/typeorm";

import {from, map, Observable, switchMap, tap} from "rxjs";

import {In, Repository} from "typeorm";

import {OrderStatus} from "@enums/order-status.enum";

import {OrderDTO} from "@modules/orders/dtos/order.dto";
import {Order} from "@modules/orders/entities/order.entity";
import {OrderMapper} from "@modules/orders/entities/order.mapper";
import {Product} from "@modules/orders/entities/product.entity";

@Injectable()
export class OrdersService implements OnModuleDestroy {
    private readonly logger = new Logger(OrdersService.name);
    constructor(
        private readonly configurationService: ConfigService,
        @Inject("KAFKA_CLIENT") private readonly client: ClientKafka,
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(Product)
        private productsRepository: Repository<Product>
    ) {}

    // CRUD operations
    getOrder(id: string): Observable<OrderDTO | null> {
        return from(
            this.ordersRepository.findOne({
                where: {id},
            })
        ).pipe(
            map((entity) => {
                if (!entity) return null;
                return entity.toDTO();
            })
        );
    }

    getOrders(ids?: string[]): Observable<OrderDTO[]> {
        return from(
            this.ordersRepository.find({
                where: ids ? [{id: In(ids)}] : undefined,
            })
        ).pipe(map((entities) => entities.map((entity) => entity.toDTO())));
    }

    createOrder(order: OrderDTO): Observable<OrderDTO> {
        return from(this.ordersRepository.save(order.toEntity())).pipe(
            map((entity) => entity.toDTO()),
            tap((order) => {
                this.client.emit("orders.created", order.toPlain());
            })
        );
    }

    updateOrder(id: string, data: Partial<OrderDTO>): Observable<OrderDTO> {
        const partialEntity: Partial<Order> =
            new OrderMapper().partialDTOtoPartialEntity(data);
        /*
        // ! This creates the entity if it didn't exist previously, which is not what we want
        return from(this.ordersRepository.save(partialEntity)).pipe(
            switchMap((entity) => this.getOrder(entity.id)),
            tap((order) => {
                this.client.emit("orders.updated", order.toPlain());
            })
        );
        */
        return from(this.ordersRepository.update(id, partialEntity)).pipe(
            switchMap((result) => {
                if (result.affected > 0) return this.getOrder(id);
                else
                    throw new NotFoundException(
                        `Order with ID ${id} not found`
                    );
            }),
            tap((order) => {
                this.client.emit("orders.updated", order.toPlain());
            })
        );
    }

    deleteOrder(id: string): Observable<void> {
        return from(this.ordersRepository.delete(id)).pipe(
            map((result) => {
                if (result.affected > 0) {
                    this.client.emit("orders.deleted", {id});
                    return;
                } else
                    throw new NotFoundException(
                        `Order with ID ${id} not found`
                    );
            })
        );
    }

    // Business logic
    requestConfirmation(id: string): Observable<void> {
        return this.getOrder(id).pipe(
            tap((order) => {
                if (!order)
                    throw new NotFoundException(
                        `Order with ID ${id} not found`
                    );
                if (order.status !== OrderStatus.PENDING)
                    throw new BadRequestException(
                        `Order with id ${id} cannot be confirmed because it is not in ${OrderStatus.PENDING} status`
                    );

                this.client.emit("stock.reserve", {
                    order: order.id,
                    products: order.products,
                });
            }),
            map(() => void 0)
        );
    }

    processOrder(
        id: string,
        {success, reason}: {success: boolean; reason?: string}
    ): Observable<OrderDTO> {
        if (success) return this.confirmOrder(id);
        return this.cancelOrder(id, reason);
    }

    confirmOrder(id: string): Observable<OrderDTO> {
        return this.getOrder(id).pipe(
            switchMap((order) => {
                if (!order)
                    throw new NotFoundException(
                        `Order with ID ${id} not found`
                    );
                if (order.status !== OrderStatus.PENDING) {
                    throw new BadRequestException(
                        `Order with id ${id} cannot be confirmed because it is not in ${OrderStatus.PENDING} status`
                    );
                }
                return this.updateOrder(id, {
                    status: OrderStatus.CONFIRMED,
                });
            }),
            tap((order) =>
                this.client.emit("orders.confirmed", {
                    id: order.id,
                })
            )
        );
    }

    cancelOrder(id: string, reason?: string): Observable<OrderDTO> {
        return this.getOrder(id).pipe(
            switchMap((order) => {
                if (!order)
                    throw new NotFoundException(
                        `Order with ID ${id} not found`
                    );
                switch (order.status) {
                    case OrderStatus.SHIPPED:
                        throw new BadRequestException(
                            `Order with id ${id} cannot be shipped because it has already been shipped`
                        );
                    case OrderStatus.DELIVERED:
                        throw new BadRequestException(
                            `Order with id ${id} cannot be cancelled because it has already been delivered`
                        );
                    default:
                        return this.updateOrder(id, {
                            status: OrderStatus.CANCELLED,
                        }).pipe(
                            tap(() => {
                                switch (order.status) {
                                    // ? Stock compensation event in case the order hasn't been shipped
                                    case OrderStatus.CONFIRMED:
                                        return this.client.emit(
                                            "stock.compensate",
                                            {
                                                orderId: id,
                                                products: order.products.map(
                                                    (p) => ({
                                                        id: p.id,
                                                        quantity: p.quantity,
                                                    })
                                                ),
                                            }
                                        );
                                    // TODO: Decide if we want to compensate the stock in other scenarios such as:
                                    // - OrderStatus.RETURNED (where products have been received and validated)
                                    default:
                                        return;
                                }
                            })
                        );
                }
            }),
            tap((order) =>
                this.client.emit("orders.cancelled", {
                    id: order.id,
                    reason,
                })
            )
        );
    }

    shipOrder(id: string): Observable<OrderDTO> {
        return this.getOrder(id).pipe(
            switchMap((order) => {
                if (!order)
                    throw new NotFoundException(
                        `Order with ID ${id} not found`
                    );
                if (order.status !== OrderStatus.CONFIRMED) {
                    throw new BadRequestException(
                        `Order with id ${id} cannot be shipped because it is not in ${OrderStatus.CONFIRMED} status`
                    );
                }
                return this.updateOrder(id, {
                    status: OrderStatus.SHIPPED,
                });
            }),
            tap((order) =>
                this.client.emit("orders.shipped", {
                    id: order.id,
                })
            )
        );
    }

    deliverOrder(id: string): Observable<OrderDTO> {
        return this.getOrder(id).pipe(
            switchMap((order) => {
                if (!order)
                    throw new NotFoundException(
                        `Order with ID ${id} not found`
                    );
                if (order.status !== OrderStatus.SHIPPED) {
                    throw new BadRequestException(
                        `Order with id ${id} cannot be delivered because it is not in ${OrderStatus.SHIPPED} status`
                    );
                }
                return this.updateOrder(id, {
                    status: OrderStatus.DELIVERED,
                });
            }),
            tap((order) =>
                this.client.emit("orders.delivered", {
                    id: order.id,
                })
            )
        );
    }

    async onModuleDestroy(): Promise<void> {
        try {
            await this.client.close();
            this.logger.debug("Kafka client connection closed successfully");
        } catch (error) {
            this.logger.error("Error closing Kafka client connection", error);
        }
    }
}
