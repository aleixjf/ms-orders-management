import {OrderStatus} from "@enums/order-status.enum";

import {Product} from "@domain/orders/entities/product.entity";
import {DomainEvent} from "@domain/shared/events/domain-event.class";

import {OrderAlreadyCancelledError} from "@domain/orders/errors/already-cancelled.error";
import {OrderAlreadyDeliveredError} from "@domain/orders/errors/already-delivered.error";
import {OrderAlreadyShippedError} from "@domain/orders/errors/already-shipped.error";
import {InvalidStatusTransitionError} from "@domain/orders/errors/invalid-state-transition.error";
import {
    OrderCancelledEvent,
    OrderConfirmedEvent,
    OrderCreatedEvent,
    OrderDeliveredEvent,
    OrderShippedEvent,
    StockCompensationRequestedEvent,
    StockReservationRequestedEvent,
} from "@domain/orders/events/orders.events";
import {CustomerId} from "@domain/orders/value-objects/customer-id.vo";
import {OrderDate} from "@domain/orders/value-objects/order-date.vo";
import {OrderId} from "@domain/orders/value-objects/order-id.vo";

export class Order {
    private _id: OrderId;
    private _customerId: CustomerId;
    private _orderDate: OrderDate;
    private _deliveryDate: OrderDate;
    private _status: OrderStatus;
    private _products: Product[];
    private _domainEvents: DomainEvent[] = [];

    constructor(
        id: OrderId,
        customerId: CustomerId,
        orderDate: OrderDate,
        deliveryDate: OrderDate,
        products: Product[],
        status?: OrderStatus
    ) {
        this._id = id;
        this._customerId = customerId;
        this._orderDate = orderDate;
        this._deliveryDate = deliveryDate;
        this._products = products;
        this._status = status || OrderStatus.PENDING; // Default to PENDING if not provided

        // Only add creation event for new orders (orders without status)
        if (!status) {
            this.addDomainEvent(
                new OrderCreatedEvent(
                    this._id,
                    this._customerId.value,
                    this._products.map((p) => ({
                        productId: p.id,
                        quantity: p.quantity,
                    }))
                )
            );
        }
    }

    // Getters & Setters
    get id(): OrderId {
        return this._id;
    }

    get customerId(): CustomerId {
        return this._customerId;
    }

    get orderDate(): OrderDate {
        return this._orderDate;
    }

    get deliveryDate(): OrderDate {
        return this._deliveryDate;
    }

    get status(): OrderStatus {
        return this._status;
    }

    get products(): Product[] {
        return [...this._products]; // Return copy to maintain immutability
    }

    get domainEvents(): DomainEvent[] {
        return [...this._domainEvents];
    }

    get price(): number {
        return this._products.reduce((total, product) => {
            return total + product.subtotal;
        }, 0);
    }

    // Methods
    requestConfirmation(): void {
        this.validateTransition(OrderStatus.CONFIRMED);

        this.addDomainEvent(
            new StockReservationRequestedEvent(
                this._id,
                this._products.map((p) => ({
                    productId: p.id,
                    quantity: p.quantity,
                }))
            )
        );
    }

    confirm(): void {
        this.validateTransition(OrderStatus.CONFIRMED);

        this._status = OrderStatus.CONFIRMED;
        this.addDomainEvent(new OrderConfirmedEvent(this._id));
    }

    cancel(reason?: string): void {
        this.validateTransition(OrderStatus.CANCELLED);

        // ? If order was confirmed, we should compensate stock in the stock service
        if (this._status === OrderStatus.CONFIRMED) {
            this.addDomainEvent(
                new StockCompensationRequestedEvent(
                    this._id,
                    this._products.map((p) => ({
                        productId: p.id,
                        quantity: p.quantity,
                    }))
                )
            );
        }

        this._status = OrderStatus.CANCELLED;
        this.addDomainEvent(new OrderCancelledEvent(this._id, reason));
    }

    ship(): void {
        this.validateTransition(OrderStatus.SHIPPED);

        this._status = OrderStatus.SHIPPED;
        this.addDomainEvent(new OrderShippedEvent(this._id));
    }

    deliver(): void {
        this.validateTransition(OrderStatus.DELIVERED);

        this._status = OrderStatus.DELIVERED;
        this.addDomainEvent(new OrderDeliveredEvent(this._id));
    }

    private validateTransition(action: OrderStatus): void {
        switch (this._status) {
            case OrderStatus.PENDING:
                if (
                    [OrderStatus.CONFIRMED, OrderStatus.CANCELLED].includes(
                        action
                    )
                )
                    return;
                throw new InvalidStatusTransitionError({
                    order: this,
                    action,
                });
            case OrderStatus.CONFIRMED:
                if (
                    [OrderStatus.CANCELLED, OrderStatus.SHIPPED].includes(
                        action
                    )
                )
                    return;
                throw new InvalidStatusTransitionError({
                    order: this,
                    action,
                });
            case OrderStatus.CANCELLED:
                throw new OrderAlreadyCancelledError({
                    order: this,
                    action,
                });
            case OrderStatus.DELIVERED:
                throw new OrderAlreadyDeliveredError({
                    order: this,
                    action,
                });
            case OrderStatus.SHIPPED:
                if ([OrderStatus.DELIVERED].includes(action)) return;
                throw new OrderAlreadyShippedError({
                    order: this,
                    action,
                });
            default:
                return;
        }
    }

    // ? Private method so that only this class can add domain events
    private addDomainEvent(event: DomainEvent): void {
        this._domainEvents.push(event);
    }

    // ? Public method to clear domain events after they have been processed by the event publisher
    clearDomainEvents(): void {
        this._domainEvents = [];
    }

    // Factory Methods
    static create(
        customerId: CustomerId,
        orderDate: OrderDate,
        deliveryDate: OrderDate,
        products: Product[],
        status?: OrderStatus
    ): Order {
        if (!products || products.length === 0) {
            throw new Error("Order must have at least one product");
        }

        return new Order(
            OrderId.generate(),
            customerId,
            orderDate,
            deliveryDate,
            products,
            status
        );
    }

    static fromPersistence(
        id: OrderId,
        customerId: CustomerId,
        orderDate: OrderDate,
        deliveryDate: OrderDate,
        products: Product[],
        status: OrderStatus
    ): Order {
        return new Order(
            id,
            customerId,
            orderDate,
            deliveryDate,
            products,
            status
        );
    }
}
