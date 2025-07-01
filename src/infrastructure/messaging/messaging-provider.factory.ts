import {Inject, Injectable, Optional} from "@nestjs/common";

import {KAFKA_PROVIDER} from "@infrastructure/messaging/messaging.module";

import type {
    IMessagingProvider,
    IMessagingProviderConfig,
    IMessagingProviderFactory,
} from "@infrastructure/messaging/interfaces/messaging-provider.interface";

import {KafkaMessagingProvider} from "@infrastructure/messaging/providers/kafka/adapters/kafka-messaging.provider";

/**
 * Factory for creating messaging providers
 * This allows easy switching between different messaging systems
 *
 * Note: This factory now acts as a selector rather than a creator since
 * providers are instantiated by their respective modules through DI
 */
@Injectable()
export class MessagingProviderFactory implements IMessagingProviderFactory {
    private readonly providers = new Map<string, IMessagingProvider>();

    constructor(
        @Optional()
        @Inject(KafkaMessagingProvider)
        private readonly kafkaProvider?: IMessagingProvider
        // Future providers can be injected here:
        // @Optional() @Inject("RABBITMQ_MESSAGING_PROVIDER")
        // private readonly rabbitmqProvider?: IMessagingProvider,
        // @Optional() @Inject("REDIS_MESSAGING_PROVIDER")
        // private readonly redisProvider?: IMessagingProvider,
    ) {
        // Register available providers that were injected
        this.registerProviders();
    }

    create(config: IMessagingProviderConfig): IMessagingProvider {
        const provider = this.providers.get(config.provider);
        if (!provider) {
            throw new Error(
                `Messaging provider "${config.provider}" is not supported. Available providers: ${this.getSupportedProviders().join(", ")}`
            );
        }

        return provider;
    }

    getSupportedProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    /**
     * Register a new messaging provider instance
     */
    private registerProvider(name: string, provider: IMessagingProvider): void {
        this.providers.set(name, provider);
    }

    /**
     * Register providers that were successfully injected
     */
    private registerProviders(): void {
        if (this.kafkaProvider)
            this.registerProvider(KAFKA_PROVIDER, this.kafkaProvider);

        // Future providers will be registered here when available:
        /*
        if (this.rabbitmqProvider)
            this.registerProvider(RABBITMQ_PROVIDER, this.rabbitmqProvider);

        if (this.redisProvider)
            this.registerProvider(REDIS_PROVIDER, this.redisProvider);
        */
    }
}
