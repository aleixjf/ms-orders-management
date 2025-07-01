import {DynamicModule, Module} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {ClientsModule, Transport} from "@nestjs/microservices";

import {KafkaEventPublisher} from "@infrastructure/messaging/providers/kafka/adapters/kafka-event.publisher.adapter";
import {KafkaEventSubscriber} from "@infrastructure/messaging/providers/kafka/adapters/kafka-event.subscriber.adapter";
import {KafkaMessagingProvider} from "@infrastructure/messaging/providers/kafka/adapters/kafka-messaging.provider";

export interface KafkaModuleOptions {
    clientId?: string;
    brokers?: string[];
    groupId?: string;
    isGlobal?: boolean;
}

// ! We can't export this DI token as a constant because it would cause circular dependencies when imported in other modules.
const KAFKA_CLIENT = "KAFKA_CLIENT";

@Module({})
export class KafkaModule {
    /**
     * Create a KafkaModule configured for the root AppModule.
     * This ensures the module is instantiated only once across the entire application.
     * @param options Configuration options for the Kafka module
     * @returns A configured DynamicModule
     */
    static forRoot(options?: KafkaModuleOptions): DynamicModule {
        return {
            module: KafkaModule,
            global: options?.isGlobal ?? true, // Global by default
            imports: [
                ClientsModule.registerAsync([
                    {
                        inject: [ConfigService],
                        name: KAFKA_CLIENT,
                        useFactory: async (configService: ConfigService) => {
                            return {
                                transport: Transport.KAFKA,
                                options: {
                                    client: {
                                        clientId:
                                            options?.clientId ??
                                            "ms-orders-management",
                                        brokers:
                                            options?.brokers ??
                                            configService.get<string[]>(
                                                "kafka.brokers"
                                            ),
                                    },
                                    consumer: {
                                        groupId:
                                            options?.groupId ??
                                            configService.get<string>(
                                                "kafka.groupId"
                                            ),
                                    },
                                },
                            };
                        },
                    },
                ]),
            ],
            providers: [
                KafkaEventPublisher,
                KafkaEventSubscriber,
                KafkaMessagingProvider,
            ],
            exports: [
                ClientsModule, // ? Export ClientsModule to make KAFKA_CLIENT available
                KafkaMessagingProvider, // ? Export the provider to be used in the MessagingModule, if required
            ],
        };
    }

    /**
     * Create a KafkaModule for feature modules.
     * This allows feature modules to access Kafka providers without creating a new instance.
     * The root KafkaModule must be configured using forRoot() in the AppModule.
     * @returns A configured DynamicModule for feature modules
     */
    static forFeature(): DynamicModule {
        return {
            module: KafkaModule,
            providers: [
                KafkaEventPublisher,
                KafkaEventSubscriber,
                KafkaMessagingProvider,
            ],
            exports: [
                KafkaEventPublisher,
                KafkaEventSubscriber,
                KafkaMessagingProvider,
            ],
        };
    }
}
