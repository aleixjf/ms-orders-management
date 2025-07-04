import {Injectable, Logger, NotFoundException} from "@nestjs/common";

import {forkJoin, map, Observable, switchMap} from "rxjs";

import {Order} from "@domain/orders/entities/order.entity";
import {Product} from "@domain/orders/entities/product.entity";

import {type IOrderRepository} from "@domain/orders/repositories/order.repository";
import {ProductDescription, ProductName} from "@domain/orders/value-objects";
import {CustomerId} from "@domain/orders/value-objects/customer-id.vo";
import {OrderDate} from "@domain/orders/value-objects/order-date.vo";
import {OrderId} from "@domain/orders/value-objects/order-id.vo";
import {ProductId} from "@domain/orders/value-objects/product-id.vo";
import {ProductQuantity} from "@domain/orders/value-objects/product-quantity.vo";
import {DomainEventPublisherAdapter} from "@infrastructure/messaging/adapters/publisher.adapter";

@Injectable()
export class OrderDomainService {
    private readonly logger = new Logger(OrderDomainService.name);

    constructor(
        private readonly orderRepository: IOrderRepository,
        private readonly eventPublisher: DomainEventPublisherAdapter
    ) {}

    createOrder(
        customerId: CustomerId,
        products: Array<{
            id: ProductId;
            quantity: ProductQuantity;
            name?: ProductName;
            description?: ProductDescription;
            price?: number;
        }>
    ): Observable<Order> {
        // Create order date and delivery date
        const orderDate = OrderDate.now();
        const deliveryDate = OrderDate.fromTimestamp(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        ); // 7 days from now

        const productEntities = products.map((p) =>
            Product.create(p.id, p.quantity, p.name, p.description, p.price)
        );

        // Create Domain Entity
        const order = Order.create(
            customerId,
            orderDate,
            deliveryDate,
            productEntities
        );

        // Save through Repository
        return this.orderRepository
            .save(order)
            .pipe(
                switchMap((savedOrder) =>
                    this.emit([order, savedOrder]).pipe(map(() => savedOrder))
                )
            );
    }

    getOrder(orderId: OrderId): Observable<Order | null> {
        return this.orderRepository.findById(orderId);
    }

    getOrders(orderIds?: OrderId[]): Observable<Order[]> {
        if (orderIds && orderIds.length > 0) {
            return this.orderRepository.findByIds(orderIds);
        }
        return this.orderRepository.findAll();
    }

    reserveOrder(orderId: OrderId): Observable<void> {
        return this.orderRepository.findById(orderId).pipe(
            switchMap((order) => {
                if (!order) {
                    throw new NotFoundException(
                        `Order with ID ${orderId.value} not found`
                    );
                }

                order.requestConfirmation();
                return this.orderRepository
                    .save(order)
                    .pipe(
                        switchMap((savedOrder) =>
                            this.emit([order, savedOrder])
                        )
                    );
            })
        );
    }

    confirmOrder(orderId: OrderId): Observable<void> {
        return this.orderRepository.findById(orderId).pipe(
            switchMap((order) => {
                if (!order) {
                    throw new NotFoundException(
                        `Order with ID ${orderId.value} not found`
                    );
                }

                order.confirm();
                return this.orderRepository
                    .save(order)
                    .pipe(
                        switchMap((savedOrder) =>
                            this.emit([order, savedOrder])
                        )
                    );
            })
        );
    }

    cancelOrder(orderId: OrderId): Observable<void> {
        return this.orderRepository.findById(orderId).pipe(
            switchMap((order) => {
                if (!order) {
                    throw new NotFoundException(
                        `Order with ID ${orderId.value} not found`
                    );
                }

                order.cancel();
                return this.orderRepository
                    .save(order)
                    .pipe(
                        switchMap((savedOrder) =>
                            this.emit([order, savedOrder])
                        )
                    );
            })
        );
    }

    shipOrder(orderId: OrderId): Observable<void> {
        return this.orderRepository.findById(orderId).pipe(
            switchMap((order) => {
                if (!order) {
                    throw new NotFoundException(
                        `Order with ID ${orderId.value} not found`
                    );
                }

                order.ship();
                return this.orderRepository
                    .save(order)
                    .pipe(
                        switchMap((savedOrder) =>
                            this.emit([order, savedOrder])
                        )
                    );
            })
        );
    }

    deliverOrder(orderId: OrderId): Observable<void> {
        return this.orderRepository.findById(orderId).pipe(
            switchMap((order) => {
                if (!order) {
                    throw new NotFoundException(
                        `Order with ID ${orderId.value} not found`
                    );
                }

                order.deliver();
                return this.orderRepository
                    .save(order)
                    .pipe(
                        switchMap((savedOrder) =>
                            this.emit([order, savedOrder])
                        )
                    );
            })
        );
    }

    private emit(orders: Order[]): Observable<void> {
        return this.eventPublisher
            .publishBatch(orders.flatMap((order) => order.domainEvents))
            .pipe(
                switchMap(() =>
                    forkJoin([orders.map((order) => order.clearDomainEvents())])
                ),
                map(() => undefined)
            );
    }
}
