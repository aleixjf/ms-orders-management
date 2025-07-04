import {Injectable, NotFoundException} from "@nestjs/common";

import {Observable} from "rxjs";
import {map} from "rxjs/operators";

import {OrderDTO} from "@application/orders/dtos/order.dto";
import {OrderMapper} from "@application/orders/mappers/order.mapper";

import {OrderDomainService} from "@domain/orders/services/order.domain.service";

import {CreateOrderCommand} from "@application/orders/commands/create-order.command";
import {ProductDescription, ProductName} from "@domain/orders/value-objects";
import {CustomerId} from "@domain/orders/value-objects/customer-id.vo";
import {OrderId} from "@domain/orders/value-objects/order-id.vo";
import {ProductId} from "@domain/orders/value-objects/product-id.vo";
import {ProductQuantity} from "@domain/orders/value-objects/product-quantity.vo";

@Injectable()
export class OrdersAppService {
    constructor(
        private readonly orderApplicationService: OrderDomainService,
        private readonly orderMapper: OrderMapper
    ) {}

    createOrder(dto: CreateOrderCommand): Observable<OrderDTO> {
        const customerId = CustomerId.create(dto.customerId);

        const products = dto.products.map((product) => ({
            id: ProductId.create(product.id),
            quantity: ProductQuantity.create(product.quantity),
            name: ProductName.create(product.name),
            description: ProductDescription.create(product.description),
            price: product.price,
        }));

        return this.orderApplicationService
            .createOrder(customerId, products)
            .pipe(map((order) => OrderMapper.toDTO(order)));
    }

    getOrder(id: string): Observable<OrderDTO> {
        const orderId = OrderId.create(id);
        return this.orderApplicationService.getOrder(orderId).pipe(
            map((order) => {
                if (!order) {
                    throw new NotFoundException(
                        `Order with ID ${id} not found`
                    );
                }
                return OrderMapper.toDTO(order);
            })
        );
    }

    getOrders(ids?: string[]): Observable<OrderDTO[]> {
        const orderIds = ids ? ids.map((id) => OrderId.create(id)) : undefined;
        return this.orderApplicationService
            .getOrders(orderIds)
            .pipe(
                map((orders) => orders.map((order) => OrderMapper.toDTO(order)))
            );
    }

    reserveOrder(orderId: string): Observable<void> {
        const id = OrderId.create(orderId);
        return this.orderApplicationService.reserveOrder(id);
    }

    confirmOrder(orderId: string): Observable<void> {
        const id = OrderId.create(orderId);
        return this.orderApplicationService.confirmOrder(id);
    }

    cancelOrder(orderId: string): Observable<void> {
        const id = OrderId.create(orderId);
        return this.orderApplicationService.cancelOrder(id);
    }

    shipOrder(orderId: string): Observable<void> {
        const id = OrderId.create(orderId);
        return this.orderApplicationService.shipOrder(id);
    }

    deliverOrder(orderId: string): Observable<void> {
        const id = OrderId.create(orderId);
        return this.orderApplicationService.deliverOrder(id);
    }
}
