import {Observable} from "rxjs";

import {IMessage} from "@infrastructure/messaging/interfaces/message.interface";
import {IEventPublisher} from "@infrastructure/messaging/interfaces/publisher.interface";
import {IEventSubscriber} from "@infrastructure/messaging/interfaces/subscriber.interface";

/**
 * Messaging provider configuration
 */
export interface IMessagingProviderConfig {
    readonly provider: "kafka" | "rabbitmq" | "redis" | "memory";
    readonly connectionOptions: Record<string, unknown>;
    readonly defaultTopic?: string;
    readonly retryPolicy?: IRetryPolicy;
}

/**
 * Retry policy configuration
 */
export interface IRetryPolicy {
    readonly maxRetries: number;
    readonly initialDelayMs: number;
    readonly maxDelayMs: number;
    readonly backoffMultiplier: number;
}

/**
 * Generic messaging provider interface
 * This interface should be implemented by specific messaging providers (Kafka, RabbitMQ, etc.)
 */
export interface IMessagingProvider extends IEventPublisher, IEventSubscriber {
    /**
     * Check if the provider is connected
     */
    connected: boolean;

    /**
     * Connect to the messaging system
     */
    connect(): Promise<void>;

    /**
     * Disconnect from the messaging system
     */
    disconnect(): Promise<void>;

    /**
     * Send a message and wait for a response (RPC pattern)
     */
    send(pattern: string, message: IMessage): Observable<IMessage>;

    /**
     * Get provider-specific health information
     */
    health(): Observable<IProviderHealthInfo>;
}

/**
 * Provider health information
 */
export interface IProviderHealthInfo {
    readonly isHealthy: boolean;
    readonly provider: string;
    readonly details: Record<string, unknown>;
    readonly lastChecked: Date;
}

/**
 * Messaging provider factory interface
 */
export interface IMessagingProviderFactory {
    /**
     * Create a messaging provider based on configuration
     */
    create(config: IMessagingProviderConfig): IMessagingProvider;

    /**
     * List supported provider types
     */
    getSupportedProviders(): string[];
}
