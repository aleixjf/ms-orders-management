import {
    Inject,
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {ClientKafka} from "@nestjs/microservices";

import {Observable} from "rxjs";

import {KAFKA_PROVIDER} from "@infrastructure/messaging/messaging.module";

import {IMessage} from "@infrastructure/messaging/interfaces/message.interface";
import {
    IMessagingProvider,
    IProviderHealthInfo,
} from "@infrastructure/messaging/interfaces/messaging-provider.interface";

import {KafkaEventPublisher} from "@infrastructure/messaging/providers/kafka/adapters/kafka-event.publisher.adapter";
import {KafkaEventSubscriber} from "@infrastructure/messaging/providers/kafka/adapters/kafka-event.subscriber.adapter";

/**
 * Kafka implementation of the messaging provider
 * This adapter allows the messaging system to work with Kafka
 */
@Injectable()
export class KafkaMessagingProvider
    implements IMessagingProvider, OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(KafkaMessagingProvider.name);

    // Lifecycle hooks
    constructor(
        private readonly configService: ConfigService,
        @Inject("KAFKA_CLIENT") private readonly kafkaClient: ClientKafka,
        @Inject(KafkaEventPublisher)
        private readonly eventPublisher: KafkaEventPublisher,
        @Inject(KafkaEventSubscriber)
        private readonly eventSubscriber: KafkaEventSubscriber
    ) {}

    async onModuleInit(): Promise<void> {
        if (!this.kafkaClient) {
            this.logger.error(
                "Kafka client is not initialized. Ensure KAFKA_CLIENT is properly configured."
            );
            throw new Error("Kafka client is not initialized");
        }
    }

    async onModuleDestroy(): Promise<void> {
        try {
            await this.kafkaClient.close();
            this.logger.debug("Kafka client connection closed successfully");
        } catch (error) {
            this.logger.error("Error closing Kafka client connection", error);
        }
    }

    // Methods
    private _isConnected = false;
    get connected(): boolean {
        return this._isConnected;
    }
    private set connected(value: boolean) {
        this._isConnected = value;
    }

    async connect(): Promise<void> {
        try {
            await this.kafkaClient.connect();
            this.connected = true;
            this.logger.log("Successfully connected to Kafka");
        } catch (error) {
            this.connected = false;
            this.logger.error("Failed to connect to Kafka", error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.kafkaClient.close();
            this.connected = false;
            this.eventSubscriber.close().subscribe();
            this.logger.log("Successfully disconnected from Kafka");
        } catch (error) {
            this.logger.error("Error disconnecting from Kafka", error);
            throw error;
        }
    }

    health(): Observable<IProviderHealthInfo> {
        return new Observable<IProviderHealthInfo>((observer) => {
            observer.next({
                provider: KAFKA_PROVIDER,
                isHealthy: this.connected,
                details: {
                    connectionStatus: this.connected
                        ? "connected"
                        : "disconnected",
                    subscriptionsCount: this.eventSubscriber.count,
                    brokers: this.configService.get<string[]>("kafka.brokers", [
                        "localhost:9092",
                    ]),
                },
                lastChecked: new Date(),
            });
            observer.complete();
        });
    }

    // Methods - Event Publisher
    publish(topic: string, message: IMessage): Observable<unknown> {
        return this.eventPublisher.publish(topic, message);
    }

    emit(topic: string, message: IMessage): void {
        return this.eventPublisher.emit(topic, message);
    }

    send(pattern: string, message: IMessage): Observable<IMessage> {
        return this.eventPublisher.send(pattern, message);
    }

    // Methods - Event Subscriber
    subscribe(topic: string, callback: (data: IMessage) => void): void {
        return this.eventSubscriber.subscribe(topic, callback);
    }

    unsubscribe(topic: string): Observable<void> {
        return this.eventSubscriber.unsubscribe(topic);
    }

    close(): Observable<void> {
        return this.eventSubscriber.close();
    }
}
