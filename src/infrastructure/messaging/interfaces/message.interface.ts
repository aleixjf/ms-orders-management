/**
 * Generic message payload
 */
export interface IMessagePayload {
    [key: string]: unknown;
}

/**
 * Message with metadata
 */
export interface IMessage {
    readonly id: string;
    readonly pattern: string;
    readonly payload: IMessagePayload;
    readonly timestamp: Date;
    readonly headers?: Record<string, string>;
    readonly correlationId?: string;
    readonly replyTo?: string;
}
