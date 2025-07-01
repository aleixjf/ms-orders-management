import {Injectable} from "@nestjs/common";

import {Order as Order} from "@domain/orders/entities/order.entity";
import {Product as Product} from "@domain/orders/entities/product.entity";
import {Order as OrderEntity} from "@infrastructure/persistence/orders/entities/order.typeorm.entity";
import {Product as ProductEntity} from "@infrastructure/persistence/orders/entities/product.typeorm.entity";

import {ProductDescription, ProductName} from "@domain/orders/value-objects";
import {CustomerId} from "@domain/orders/value-objects/customer-id.vo";
import {OrderDate} from "@domain/orders/value-objects/order-date.vo";
import {OrderId} from "@domain/orders/value-objects/order-id.vo";
import {ProductId} from "@domain/orders/value-objects/product-id.vo";
import {ProductQuantity} from "@domain/orders/value-objects/product-quantity.vo";

/**
 * Maps TypeORM Order entities to Domain Order entities and vice versa.
 */
@Injectable()
export class OrderMapper {
    /**
     * Maps a TypeORM Order entity to a Domain Order entity.
     * @param entity - The TypeORM Order entity to map.
     * @returns The mapped Domain Order entity.
     */
    static fromEntity(entity: OrderEntity): Order {
        const products = entity.products.map((p) =>
            Product.create(
                ProductId.create(p.id),
                ProductQuantity.create(p.quantity),
                ProductName.create(p.name),
                ProductDescription.create(p.description),
                p.price ? parseFloat(p.price) : undefined
            )
        );

        return Order.fromPersistence(
            OrderId.create(entity.id),
            CustomerId.create(entity.customer_id),
            OrderDate.fromTimestamp(entity.order_date),
            OrderDate.fromTimestamp(entity.delivery_date),
            products,
            entity.status
        );
    }

    /**
     * Maps a Domain Order entity to a TypeORM Order entity.
     * @param order - The domain Order entity to map.
     * @returns The mapped TypeORM Order entity.
     */
    static toEntity(order: Order): OrderEntity {
        const products = order.products.map((p) => {
            const product = new ProductEntity({
                id: p.id.value,
                quantity: p.quantity.value,
                name: p.name?.value,
                description: p.description?.value,
                price: p.price ? p.price.toString() : undefined,
            });
            return product;
        });

        return new OrderEntity({
            id: order.id.value,
            customer_id: order.customerId.value,
            order_date: order.orderDate.value,
            delivery_date: order.deliveryDate.value,
            status: order.status,
            products: products,
        });
    }
}
