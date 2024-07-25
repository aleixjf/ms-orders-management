import {Module} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {ClientProxyFactory, Transport} from "@nestjs/microservices";
import {TypeOrmModule} from "@nestjs/typeorm";

import {Order} from "@modules/orders/entities/order.entity";
import {Product} from "@modules/orders/entities/product.entity";

import {OrdersService} from "@modules/orders/orders.service";

import {OrdersgRPCController} from "@modules/orders/controllers/orders.grpc.controller";
import {OrdersHTTPController} from "@modules/orders/controllers/orders.http.controller";

import {OrdersEvents} from "@modules/orders/controllers/orders.events";

@Module({
    controllers: [OrdersHTTPController, OrdersgRPCController, OrdersEvents],
    imports: [
        TypeOrmModule.forFeature([Order, Product]),
        /*
        .registerAsync({
            useFactory: () => ({
                timeout: 5000,
                maxRedirects: 5,
            }),
        }),
        */
    ],
    providers: [
        {
            // KafkaJS Client
            provide: "KAFKA_CLIENT",
            useFactory: (configService: ConfigService) =>
                ClientProxyFactory.create({
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            brokers: [
                                configService.get<string>("kafka.broker"),
                            ],
                        },
                    },
                }),
            inject: [ConfigService],
        },
        OrdersService,
    ],
})
export class OrdersModule {}
