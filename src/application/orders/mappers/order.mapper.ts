import {Injectable} from "@nestjs/common";

import {OrderDTO} from "@application/orders/dtos/order.dto";
import {Order} from "@domain/orders/entities/order.entity";
import {Product} from "@domain/orders/entities/product.entity";

import {
    CustomerId,
    OrderDate,
    ProductDescription,
    ProductId,
    ProductName,
    ProductQuantity,
} from "@domain/orders/value-objects";

/**
 * Maps an Order domain entity to an OrderDTO and vice versa.
 */
@Injectable()
export class OrderMapper {
    /**
     * Maps an Order domain entity to an OrderDTO.
     * @param order - The Order domain entity to map.
     * @returns The mapped OrderDTO.
     */
    static toDTO(order: Order): OrderDTO {
        return {
            id: order.id.value,
            customerId: order.customerId.value,
            status: order.status,
            orderDate: order.orderDate.value,
            deliveryDate: order.deliveryDate.value,
            products: order.products.map((product) => ({
                id: product.id.value,
                quantity: product.quantity.value,
                name: product.name.value,
                description: product.description.value,
                price: product.price,
            })),
            price: order.price,
        };
    }

    /**
     * Maps an OrderDTO to an Order entity.
     * @param dto - The OrderDTO to map.
     * @returns The mapped Order entity.
     */
    static fromDTO(dto: OrderDTO): Order {
        const products = dto.products.map((product) =>
            Product.create(
                ProductId.create(product.id),
                ProductQuantity.create(product.quantity),
                ProductName.create(product.name),
                ProductDescription.create(product.description),
                product.price
            )
        );

        return Order.create(
            CustomerId.create(dto.customerId),
            OrderDate.fromTimestamp(dto.orderDate),
            OrderDate.fromTimestamp(dto.deliveryDate),
            products,
            dto.status
        );
    }
}
