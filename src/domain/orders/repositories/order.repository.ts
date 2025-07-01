import {Observable} from "rxjs";

import {Order} from "@domain/orders/entities/order.entity";

import {OrderId} from "@domain/orders/value-objects/order-id.vo";

export interface IOrderRepository {
    findById(id: OrderId): Observable<Order | null>;
    findByIds(ids: OrderId[]): Observable<Order[]>;
    findAll(): Observable<Order[]>;
    save(order: Order): Observable<Order>;
    delete(id: OrderId): Observable<void>;
}
