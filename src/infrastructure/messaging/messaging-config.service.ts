import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";

import {IMessagingProviderConfig} from "@infrastructure/messaging/interfaces/messaging-provider.interface";

/**
 * Configuration service for messaging providers
 * This centralizes all messaging configuration and makes it easy to switch providers
 */
@Injectable()
export class MessagingConfigService {
    constructor(private readonly configService: ConfigService) {}

    /**
     * Get the messaging provider configuration based on environment variables
     */
    getMessagingConfig(): IMessagingProviderConfig {
        const provider = this.configService.get<string>(
            "messaging.provider",
            "kafka"
        ) as "kafka" | "rabbitmq" | "redis" | "memory";

        switch (provider) {
            case "kafka":
                return this.getKafkaConfig();
            case "rabbitmq":
                return this.getRabbitMQConfig();
            case "redis":
                return this.getRedisConfig();
            case "memory":
                return this.getMemoryConfig();
            default:
                throw new Error(`Unsupported messaging provider: ${provider}`);
        }
    }

    /**
     * Get Kafka-specific configuration
     */
    private getKafkaConfig(): IMessagingProviderConfig {
        return {
            provider: "kafka",
            connectionOptions: {
                client: {
                    clientId: this.configService.get<string>(
                        "kafka.clientId",
                        "ms-orders-management"
                    ),
                    brokers: this.configService.get<string[]>("kafka.brokers", [
                        "localhost:9092",
                    ]),
                },
                consumer: {
                    groupId: this.configService.get<string>(
                        "kafka.groupId",
                        "orders-service-group"
                    ),
                },
                producer: {
                    allowAutoTopicCreation: this.configService.get<boolean>(
                        "kafka.allowAutoTopicCreation",
                        true
                    ),
                },
            },
            defaultTopic: this.configService.get<string>(
                "kafka.defaultTopic",
                "orders.events"
            ),
            retryPolicy: {
                maxRetries: this.configService.get<number>(
                    "kafka.retries.max",
                    3
                ),
                initialDelayMs: this.configService.get<number>(
                    "kafka.retries.initialDelay",
                    1000
                ),
                maxDelayMs: this.configService.get<number>(
                    "kafka.retries.maxDelay",
                    30000
                ),
                backoffMultiplier: this.configService.get<number>(
                    "kafka.retries.backoffMultiplier",
                    2
                ),
            },
        };
    }

    /**
     * Get RabbitMQ-specific configuration
     */
    private getRabbitMQConfig(): IMessagingProviderConfig {
        return {
            provider: "rabbitmq",
            connectionOptions: {
                urls: [
                    `amqp://${this.configService.get<string>("rabbitmq.host", "localhost")}:${this.configService.get<number>("rabbitmq.port", 5672)}`,
                ],
                queue: this.configService.get<string>(
                    "rabbitmq.queue",
                    "orders.queue"
                ),
                queueOptions: {
                    durable: this.configService.get<boolean>(
                        "rabbitmq.durable",
                        true
                    ),
                    noAck: this.configService.get<boolean>(
                        "rabbitmq.noAck",
                        false
                    ),
                },
            },
            defaultTopic: this.configService.get<string>(
                "rabbitmq.defaultQueue",
                "orders.events"
            ),
            retryPolicy: {
                maxRetries: this.configService.get<number>(
                    "rabbitmq.retries.max",
                    3
                ),
                initialDelayMs: this.configService.get<number>(
                    "rabbitmq.retries.initialDelay",
                    1000
                ),
                maxDelayMs: this.configService.get<number>(
                    "rabbitmq.retries.maxDelay",
                    30000
                ),
                backoffMultiplier: this.configService.get<number>(
                    "rabbitmq.retries.backoffMultiplier",
                    2
                ),
            },
        };
    }

    /**
     * Get Redis-specific configuration
     */
    private getRedisConfig(): IMessagingProviderConfig {
        return {
            provider: "redis",
            connectionOptions: {
                host: this.configService.get<string>("redis.host", "localhost"),
                port: this.configService.get<number>("redis.port", 6379),
                password: this.configService.get<string>("redis.password"),
                db: this.configService.get<number>("redis.db", 0),
            },
            defaultTopic: this.configService.get<string>(
                "redis.defaultChannel",
                "orders:events"
            ),
            retryPolicy: {
                maxRetries: this.configService.get<number>(
                    "redis.retries.max",
                    3
                ),
                initialDelayMs: this.configService.get<number>(
                    "redis.retries.initialDelay",
                    1000
                ),
                maxDelayMs: this.configService.get<number>(
                    "redis.retries.maxDelay",
                    30000
                ),
                backoffMultiplier: this.configService.get<number>(
                    "redis.retries.backoffMultiplier",
                    2
                ),
            },
        };
    }

    /**
     * Get in-memory configuration (for testing)
     */
    private getMemoryConfig(): IMessagingProviderConfig {
        return {
            provider: "memory",
            connectionOptions: {
                maxEvents: this.configService.get<number>(
                    "memory.maxEvents",
                    10000
                ),
            },
            defaultTopic: "memory.events",
            retryPolicy: {
                maxRetries: 1,
                initialDelayMs: 100,
                maxDelayMs: 1000,
                backoffMultiplier: 1,
            },
        };
    }
}
