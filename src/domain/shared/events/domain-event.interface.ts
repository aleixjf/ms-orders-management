/**
 * Base interface for domain events
 * This interface is completely pure domain and has no infrastructure dependencies
 */
export interface IDomainEvent {
    /**
     * Type/name of the event (e.g., "OrderCreated", "ProductUpdated")
     */
    readonly eventType: string;

    /**
     * When the event occurred
     */
    readonly occurredOn: Date;

    /**
     * The event payload containing the actual data
     */
    readonly payload: Record<string, unknown>;

    /**
     * Optional metadata for the event
     */
    readonly metadata?: Record<string, unknown>;
}
