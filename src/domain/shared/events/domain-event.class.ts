import {IDomainEvent} from "@domain/shared/events/domain-event.interface";

export abstract class DomainEvent implements IDomainEvent {
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventType: string;

    readonly version: number;
    readonly payload: Record<string, unknown>;
    readonly metadata?: Record<string, unknown>; // Optional metadata for additional information

    constructor(
        eventType: string,
        payload: Record<string, unknown> = {},
        metadata: Record<string, unknown> = {}
    ) {
        this.eventId = crypto.randomUUID();
        this.occurredOn = new Date();
        this.eventType = eventType;
        this.version = 1; // Default version, can be overridden
        this.payload = payload;
        this.metadata = metadata;
    }
}
