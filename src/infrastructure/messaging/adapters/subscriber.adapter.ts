import {IDomainEvent} from "@domain/shared/events/domain-event.interface";
import {IMessage} from "@infrastructure/messaging/interfaces/message.interface";
import {IMessagingProvider} from "@infrastructure/messaging/interfaces/messaging-provider.interface";

/**
 * Domain adapter for subscribing to events
 */
export class DomainEventSubscriberAdapter {
    constructor(private readonly messagingProvider: IMessagingProvider) {}

    async subscribe<T extends IDomainEvent>(
        eventType: string,
        handler: (event: T) => Promise<void>
    ): Promise<void> {
        await this.messagingProvider.subscribe(
            eventType,
            async (message: IMessage) => {
                const domainEvent = this.convertToDomainEvent(message);
                await handler(domainEvent as T);
            }
        );
    }

    private convertToDomainEvent(message: IMessage): IDomainEvent {
        return {
            eventType: message.pattern,
            occurredOn: new Date(message.timestamp),
            payload: message.payload,
        };
    }
}
