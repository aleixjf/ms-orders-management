import {Observable} from "rxjs";

import {IDomainEvent} from "@domain/shared/events/domain-event.interface";
import {IMessage} from "@infrastructure/messaging/interfaces/message.interface";
import {IMessagingProvider} from "@infrastructure/messaging/interfaces/messaging-provider.interface";

/**
 * Domain adapter that converts between domain interfaces and infrastructure messaging
 * This adapter ensures the domain layer remains completely agnostic of infrastructure details
 */
export class DomainEventPublisherAdapter {
    constructor(private readonly messagingProvider: IMessagingProvider) {}

    emit(event: IDomainEvent): void {
        const message: IMessage = {
            id: crypto.randomUUID(),
            pattern: event.eventType,
            payload: event.payload || {},
            timestamp: event.occurredOn || new Date(),
            headers: {
                eventType: event.eventType,
            },
        };

        return this.messagingProvider.emit(event.eventType, message);
    }

    /**
     * Publish a single domain event to the messaging provider
     * This method converts the domain event to a message format understood by the messaging provider
     */
    publish(event: IDomainEvent): Observable<unknown> {
        const message: IMessage = {
            id: crypto.randomUUID(),
            pattern: event.eventType,
            payload: event.payload || {},
            timestamp: event.occurredOn || new Date(),
            headers: {
                eventType: event.eventType,
            },
        };

        return this.messagingProvider.publish(event.eventType, message);
    }

    /**
     * Publish a batch of domain events to the messaging provider
     * This method allows for efficient publishing of multiple events in parallel
     */
    publishBatch(events: IDomainEvent[]): Observable<void> {
        return new Observable((subscriber) => {
            Promise.all(events.map((event) => this.publish(event))).then(() => {
                subscriber.next();
                subscriber.complete();
            });
        });
    }
}
