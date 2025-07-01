import {Observable} from "rxjs";

import {IMessage} from "@infrastructure/messaging/interfaces/message.interface";

/**
 * Infrastructure-level event subscriber interface
 */
export interface IEventSubscriber {
    /**
     * Subscribe to events with a callback
     */
    subscribe(pattern: string, callback: (message: IMessage) => void): void;

    /**
     * Unsubscribe from an event
     */
    unsubscribe(pattern: string): void;

    /**
     * Close all subscriptions
     */
    close(): Observable<void>;
}
