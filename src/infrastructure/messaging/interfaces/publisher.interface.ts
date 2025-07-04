import {Observable} from "rxjs";

import {IMessage} from "@infrastructure/messaging/interfaces/message.interface";

/**
 * Infrastructure-level event publisher interface
 * This extends the domain interface with infrastructure-specific concerns
 */
export interface IEventPublisher {
    /**
     * Publish a message to a topic/queue
     */
    publish(topic: string, message: IMessage): Observable<unknown>;

    /**
     * Emit a message without waiting for confirmation (fire-and-forget)
     */
    emit(topic: string, message: IMessage): void;

    /**
     * Send a message and wait for a response (RPC pattern)
     */
    send(pattern: string, message: IMessage): Observable<IMessage>;
}
