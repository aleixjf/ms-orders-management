import {Inject, Injectable, Logger} from "@nestjs/common";
import {ClientKafka} from "@nestjs/microservices";

import {catchError, Observable, tap, throwError} from "rxjs";

import {IMessage} from "@infrastructure/messaging/interfaces/message.interface";
import {IEventPublisher} from "@infrastructure/messaging/interfaces/publisher.interface";

@Injectable()
export class KafkaEventPublisher implements IEventPublisher {
    private readonly logger = new Logger(KafkaEventPublisher.name);

    constructor(
        @Inject("KAFKA_CLIENT") private readonly kafkaClient: ClientKafka
    ) {}

    publish(topic: string, message: IMessage): Observable<unknown> {
        this.logger.debug(`Publishing message to topic: ${topic}`, {
            messageId: message.id,
            pattern: message.pattern,
        });

        const kafkaMessage = this.convertToKafkaMessage(message);
        return this.kafkaClient.emit(topic, kafkaMessage).pipe(
            tap(() => {
                this.logger.debug(`Message published to topic: ${topic}`, {
                    messageId: message.id,
                    pattern: message.pattern,
                });
            }),
            catchError((error) => {
                this.logger.error(
                    `Error publishing message to topic ${topic}`,
                    error,
                    {messageId: message.id}
                );
                return throwError(() => error);
            })
        );
    }

    emit(topic: string, message: IMessage): void {
        this.logger.debug(`Emitting message to topic: ${topic}`, {
            messageId: message.id,
            pattern: message.pattern,
        });

        const kafkaMessage = this.convertToKafkaMessage(message);
        this.kafkaClient.emit(topic, kafkaMessage).subscribe();
    }

    send(pattern: string, message: IMessage): Observable<IMessage> {
        this.logger.debug(`Sending message with pattern: ${pattern}`, {
            messageId: message.id,
            pattern: message.pattern,
        });

        const kafkaMessage = this.convertToKafkaMessage(message);
        return this.kafkaClient.send(pattern, kafkaMessage);
    }

    /**
     * Convert our generic message format to Kafka-specific format
     */
    private convertToKafkaMessage(message: IMessage): unknown {
        return {
            id: message.id,
            pattern: message.pattern,
            data: message.payload,
            timestamp: message.timestamp.toISOString(),
            headers: message.headers,
            correlationId: message.correlationId,
            replyTo: message.replyTo,
        };
    }
}
