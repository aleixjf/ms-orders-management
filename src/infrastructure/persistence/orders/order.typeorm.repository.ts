import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";

import {from, map, Observable} from "rxjs";

import {In, Repository} from "typeorm";

import {Order} from "@domain/orders/entities/order.entity";
import {Order as OrderEntity} from "@infrastructure/persistence/orders/entities/order.typeorm.entity";
import {Product as ProductEntity} from "@infrastructure/persistence/orders/entities/product.typeorm.entity";
import {OrderMapper} from "@infrastructure/persistence/orders/mappers/order.mapper";

import {IOrderRepository} from "@domain/orders/repositories/order.repository";
import {OrderId} from "@domain/orders/value-objects/order-id.vo";

// TypeORM Entities (Infrastructure)
@Injectable()
export class OrderTypeORMRepository implements IOrderRepository {
    constructor(
        @InjectRepository(OrderEntity)
        private readonly orderRepository: Repository<OrderEntity>,
        @InjectRepository(ProductEntity)
        private readonly productRepository: Repository<ProductEntity>
    ) {}

    findById(id: OrderId): Observable<Order | null> {
        return from(
            this.orderRepository.findOne({
                where: {id: id.value},
                relations: ["products"],
            })
        ).pipe(
            map((entity) => (entity ? OrderMapper.fromEntity(entity) : null))
        );
    }

    findByIds(ids: OrderId[]): Observable<Order[]> {
        const idValues = ids.map((id) => id.value);
        return from(
            this.orderRepository.find({
                where: {id: In(idValues)},
                relations: ["products"],
            })
        ).pipe(
            map((entities) =>
                entities.map((entity) => OrderMapper.fromEntity(entity))
            )
        );
    }

    findAll(): Observable<Order[]> {
        return from(
            this.orderRepository.find({
                relations: ["products"],
            })
        ).pipe(
            map((entities) =>
                entities.map((entity) => OrderMapper.fromEntity(entity))
            )
        );
    }

    save(order: Order): Observable<Order> {
        const typeOrmEntity = OrderMapper.toEntity(order);

        return from(this.orderRepository.save(typeOrmEntity)).pipe(
            map((savedEntity) => OrderMapper.fromEntity(savedEntity))
        );
    }

    delete(id: OrderId): Observable<void> {
        return from(this.orderRepository.delete(id.value)).pipe(
            map(() => void 0)
        );
    }
}
