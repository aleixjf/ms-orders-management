import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";

import {DOMAIN_EVENT_PUBLISHER} from "@infrastructure/messaging/messaging.module";

import {OrderMapper} from "@application/orders/mappers/order.mapper";
import {Order as TypeORMOrder} from "@infrastructure/persistence/orders/entities/order.typeorm.entity";
import {Product as TypeORMProduct} from "@infrastructure/persistence/orders/entities/product.typeorm.entity";

import {OrdersAppService} from "@application/orders/services/orders.application.service";
import {OrderDomainService} from "@domain/orders/services/order.domain.service";

import {OrdersgRPCController} from "@application/orders/controllers/orders.grpc.controller";
import {OrdersHTTPController} from "@application/orders/controllers/orders.http.controller";

import {OrdersKafkaConsumer} from "@infrastructure/messaging/providers/kafka/consumers/orders.consumer";
import {OrderTypeORMRepository} from "@infrastructure/persistence/orders/order.typeorm.repository";

@Module({
    imports: [
        TypeOrmModule.forFeature([TypeORMOrder, TypeORMProduct]),
        // MessagingModule.forFeature(), // ? This is needed for the OrdersKafkaConsumer
    ],
    providers: [
        OrderMapper, // ? Mapper for converting between domain entities and DTOs
        OrdersAppService,
        // Repository implementation
        {
            provide: "IOrderRepository",
            useClass: OrderTypeORMRepository,
        },
        // Domain services
        {
            provide: OrderDomainService,
            useFactory: (orderRepository, eventPublisher) => {
                return new OrderDomainService(orderRepository, eventPublisher);
            },
            inject: ["IOrderRepository", DOMAIN_EVENT_PUBLISHER],
        },
    ],
    controllers: [
        OrdersHTTPController,
        OrdersgRPCController,
        OrdersKafkaConsumer,
    ],
    exports: [OrderDomainService],
})
export class OrdersModule {}
