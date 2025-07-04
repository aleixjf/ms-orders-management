import {Inject, Injectable, Logger} from "@nestjs/common";
import {ClientKafka} from "@nestjs/microservices";

import {from, Observable} from "rxjs";

import {IMessage} from "@infrastructure/messaging/interfaces/message.interface";
import {IEventSubscriber} from "@infrastructure/messaging/interfaces/subscriber.interface";

@Injectable()
export class KafkaEventSubscriber implements IEventSubscriber {
    private readonly logger = new Logger(KafkaEventSubscriber.name);
    private readonly subscriptions = new Map<
        string,
        (message: IMessage) => Promise<void> | void
    >();
    get count(): number {
        return this.subscriptions.size;
    }

    constructor(
        @Inject("KAFKA_CLIENT") private readonly kafkaClient: ClientKafka
    ) {}

    subscribe(topic: string, callback: (data: IMessage) => void): void {
        this.logger.debug(`Subscribing to topic: ${topic}`);

        // In a real implementation, you would set up the subscription here

        // For now, we'll just store the handler
        this.subscriptions.set(topic, callback);
    }

    unsubscribe(topic: string): Observable<void> {
        this.logger.debug(`Unsubscribing from topic: ${topic}`);

        this.subscriptions.delete(topic);

        return from(Promise.resolve());
    }

    close(): Observable<void> {
        this.logger.debug("Closing Kafka message subscriber");

        // Clear all subscriptions
        this.subscriptions.clear();

        return from(Promise.resolve());
    }
}
