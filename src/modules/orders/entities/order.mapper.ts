import {OrderDTO} from "@modules/orders/dtos/order.dto";
import {Order} from "@modules/orders/entities/order.entity";

export class OrderMapper {
    dtoToEntity(dto: OrderDTO): Order {
        return new Order({
            id: dto.id,
            customer_id: dto.customerId,
            delivery_date: dto.deliveryDate,
            order_date: dto.orderDate,
            status: dto.status,
            products: dto.products?.map((product) => product.toEntity()),
        });
    }

    partialDTOtoPartialEntity(partial: Partial<OrderDTO>): Partial<Order> {
        return {
            id: partial.id,
            customer_id: partial.customerId,
            delivery_date: partial.deliveryDate,
            order_date: partial.orderDate,
            status: partial.status,
            products: partial.products?.map((product) => product.toEntity()),
        };
    }

    getEntity(order: Order | OrderDTO): Order {
        return order instanceof Order ? order : this.dtoToEntity(order);
    }

    entityToDTO(entity: Order): OrderDTO {
        return new OrderDTO({
            id: entity.id,
            customerId: entity.customer_id,
            deliveryDate: entity.delivery_date,
            orderDate: entity.order_date,
            status: entity.status,
            products: entity.products?.map((product) => product.toDTO()),
        });
    }

    getDTO(Order: Order | OrderDTO): OrderDTO {
        return Order instanceof OrderDTO ? Order : this.entityToDTO(Order);
    }
}
