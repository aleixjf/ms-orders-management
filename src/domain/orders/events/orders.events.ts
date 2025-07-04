import {DomainEvent} from "@domain/shared/events/domain-event.class";

import {OrdersPatterns} from "@domain/orders/events/patterns/orders.patterns";
import {StockPatterns} from "@domain/orders/events/patterns/stock.patterns";
import {OrderId} from "@domain/orders/value-objects/order-id.vo";
import {ProductId} from "@domain/orders/value-objects/product-id.vo";
import {ProductQuantity} from "@domain/orders/value-objects/product-quantity.vo";

export class OrderCreatedEvent extends DomainEvent {
    constructor(
        public readonly orderId: OrderId,
        public readonly customerId: string,
        public readonly products: Array<{
            productId: ProductId;
            quantity: ProductQuantity;
        }>
    ) {
        super(OrdersPatterns.CREATED, {
            orderId: orderId.value,
            customerId: customerId,
            products: products.map((p) => ({
                productId: p.productId.value,
                quantity: p.quantity.value,
            })),
        });
    }
}

export class OrderConfirmedEvent extends DomainEvent {
    constructor(public readonly orderId: OrderId) {
        super(OrdersPatterns.CONFIRMED, {
            orderId: orderId.value,
        });
    }
}

export class OrderCancelledEvent extends DomainEvent {
    constructor(
        public readonly orderId: OrderId,
        public readonly reason?: string
    ) {
        super(OrdersPatterns.CANCELLED, {
            orderId: orderId.value,
            reason: reason,
        });
    }
}

export class OrderShippedEvent extends DomainEvent {
    constructor(public readonly orderId: OrderId) {
        super(OrdersPatterns.SHIPPED, {
            orderId: orderId.value,
        });
    }
}

export class OrderDeliveredEvent extends DomainEvent {
    constructor(public readonly orderId: OrderId) {
        super(OrdersPatterns.DELIVERED, {
            orderId: orderId.value,
        });
    }
}

export class StockReservationRequestedEvent extends DomainEvent {
    constructor(
        public readonly orderId: OrderId,
        public readonly products: Array<{
            productId: ProductId;
            quantity: ProductQuantity;
        }>
    ) {
        super(StockPatterns.RESERVE, {
            orderId: orderId.value,
            products: products.map((p) => ({
                productId: p.productId.value,
                quantity: p.quantity.value,
            })),
        });
    }
}

export class StockCompensationRequestedEvent extends DomainEvent {
    constructor(
        public readonly orderId: OrderId,
        public readonly products: Array<{
            productId: ProductId;
            quantity: ProductQuantity;
        }>
    ) {
        super(StockPatterns.COMPENSATE, {
            orderId: orderId.value,
            products: products.map((p) => ({
                productId: p.productId.value,
                quantity: p.quantity.value,
            })),
        });
    }
}
