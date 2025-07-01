import {DynamicModule, Module} from "@nestjs/common";

import {KafkaModule} from "@infrastructure/messaging/providers/kafka/kafka.module";

import {IMessagingProvider} from "@infrastructure/messaging/interfaces/messaging-provider.interface";

import {MessagingConfigService} from "@infrastructure/messaging/messaging-config.service";

import {DomainEventPublisherAdapter} from "@infrastructure/messaging/adapters/publisher.adapter";
import {DomainEventSubscriberAdapter} from "@infrastructure/messaging/adapters/subscriber.adapter";
import {MessagingProviderFactory} from "@infrastructure/messaging/messaging-provider.factory";

// DI tokens for messaging interfaces
export const DOMAIN_EVENT_PUBLISHER = "IDomainEventPublisher";
export const DOMAIN_EVENT_SUBSCRIBER = "IDomainEventSubscriber";
export const MESSAGING_PROVIDER = "IMessagingProvider";
export const MESSAGING_CONFIG = "IMessagingConfig";

export const KAFKA_PROVIDER = "kafka";
export const RABBITMQ_PROVIDER = "rabbitmq";
export const REDIS_PROVIDER = "redis";
export const MEMORY_PROVIDER = "memory";
export interface MessagingModuleOptions {
    provider?:
        | typeof KAFKA_PROVIDER
        | typeof RABBITMQ_PROVIDER
        | typeof REDIS_PROVIDER
        | typeof MEMORY_PROVIDER;
    isGlobal?: boolean;
}

@Module({})
export class MessagingModule {
    /**
     * Configure the MessagingModule for the root AppModule.
     * This ensures all messaging providers are instantiated only once and is provider-agnostic.
     */
    static forRoot(options?: MessagingModuleOptions): DynamicModule {
        const provider = options?.provider ?? "kafka"; // Default to Kafka

        return {
            module: MessagingModule,
            global: options?.isGlobal ?? true,
            imports: this.getProviderModule(provider),
            providers: [
                MessagingConfigService,
                MessagingProviderFactory,
                {
                    provide: MESSAGING_CONFIG,
                    useFactory: (configService: MessagingConfigService) =>
                        configService.getMessagingConfig(),
                    inject: [MessagingConfigService],
                },
                {
                    provide: MESSAGING_PROVIDER,
                    useFactory: (factory: MessagingProviderFactory, config) =>
                        factory.create(config),
                    inject: [MessagingProviderFactory, MESSAGING_CONFIG],
                },
                // Domain-specific providers that adapt generic messaging to domain interfaces
                {
                    provide: DOMAIN_EVENT_PUBLISHER,
                    useFactory: (messagingProvider: IMessagingProvider) =>
                        new DomainEventPublisherAdapter(messagingProvider),
                    inject: [MESSAGING_PROVIDER],
                },
                {
                    provide: DOMAIN_EVENT_SUBSCRIBER,
                    useFactory: (messagingProvider: IMessagingProvider) =>
                        new DomainEventSubscriberAdapter(messagingProvider),
                    inject: [MESSAGING_PROVIDER],
                },
            ],
            exports: [
                DOMAIN_EVENT_PUBLISHER,
                DOMAIN_EVENT_SUBSCRIBER,
                MESSAGING_PROVIDER,
                MessagingConfigService,
                MessagingProviderFactory,
            ],
        };
    }

    /**
     * Configure the MessagingModule for feature modules.
     */
    static forFeature(): DynamicModule {
        return {
            module: MessagingModule,
            providers: [
                // Feature modules only need access to domain interfaces
                {
                    provide: DOMAIN_EVENT_PUBLISHER,
                    useFactory: (messagingProvider: IMessagingProvider) =>
                        new DomainEventPublisherAdapter(messagingProvider),
                    inject: [MESSAGING_PROVIDER],
                },
            ],
            exports: [DOMAIN_EVENT_PUBLISHER],
        };
    }

    private static getProviderModule(provider: string) {
        switch (provider) {
            case KAFKA_PROVIDER:
                return [KafkaModule.forRoot()];
            case RABBITMQ_PROVIDER:
                // TODO: Implement RabbitMQModule.forRoot()
                throw new Error("RabbitMQ provider not yet implemented");
            case REDIS_PROVIDER:
                // TODO: Implement RedisModule.forRoot()
                throw new Error("Redis provider not yet implemented");
            case MEMORY_PROVIDER:
                // TODO: Implement InMemoryModule.forRoot()
                throw new Error("In-memory provider not yet implemented");
            default:
                return [KafkaModule.forRoot()];
        }
    }
}
