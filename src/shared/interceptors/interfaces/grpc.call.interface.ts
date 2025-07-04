import {Metadata, ServerUnaryCall} from "@grpc/grpc-js";

export interface gRPCCall extends ServerUnaryCall<any, any> {
    _events: any; // The type for _events can be a specific interface, but it's unclear from the provided data.
    _eventsCount: number;
    call: {
        _events: any; // The type for _events can be a specific interface, but it's unclear from the provided data.
        _eventsCount: number;
        stream: object;
        handler: object;
        options: any; // The type for options can be a specific interface, but it's unclear from the provided data.
        cancelled: boolean;
        deadlineTimer: any; // The type for deadlineTimer can be a specific interface, but it's unclear from the provided data.
        statusSent: boolean;
        deadline: any; // The type for deadline can be a specific interface, but it's unclear from the provided data.
        wantTrailers: boolean;
        metadataSent: boolean;
        canPush: boolean;
        isPushPending: boolean;
        bufferedMessages: any[]; // The type for bufferedMessages can be a specific interface, but it's unclear from the provided data.
        messagesToPush: any[]; // The type for messagesToPush can be a specific interface, but it's unclear from the provided data.
        maxSendMessageSize: number;
        maxReceiveMessageSize: number;
    };
    metadata: Metadata;
    request: any; // The type for request can be a specific interface, but it's unclear from the provided data.
    cancelled: boolean;
}

export function isgRPCCall(obj: any): obj is gRPCCall {
    return (
        "_events" in obj &&
        typeof obj._events === "object" &&
        "_eventsCount" in obj &&
        typeof obj._eventsCount === "number" &&
        "call" in obj &&
        typeof obj.call === "object" &&
        "metadata" in obj.call &&
        obj.call.metadata instanceof Metadata &&
        // "_events" in obj.call &&
        // typeof obj.call._events === "object" &&
        // "_eventsCount" in obj.call &&
        // typeof obj.call._eventsCount === "number" &&
        // "stream" in obj.call &&
        // typeof obj.call.stream === "object" &&
        // "_readableState" in obj.call.stream &&
        // typeof obj.call.stream._readableState === "object" &&
        // "_events" in obj.call.stream &&
        // typeof obj.call.stream._events === "object" &&
        // "_eventsCount" in obj.call.stream &&
        // typeof obj.call.stream._eventsCount === "number" &&
        // "_writableState" in obj.call.stream &&
        // typeof obj.call.stream._writableState === "object" &&
        // "allowHalfOpen" in obj.call.stream &&
        // typeof obj.call.stream.allowHalfOpen === "boolean" &&
        // "handler" in obj.call &&
        // typeof obj.call.handler === "object" &&
        // "type" in obj.call.handler &&
        // typeof obj.call.handler.type === "string" &&
        // "path" in obj.call.handler &&
        // typeof obj.call.handler.path === "string" &&
        // // "options" in obj.call &&
        // // typeof obj.call.options === "object" &&
        // "cancelled" in obj.call &&
        typeof obj.call.cancelled === "boolean" &&
        "metadata" in obj &&
        obj.metadata instanceof Metadata &&
        "request" in obj &&
        typeof obj.request === "object" &&
        "cancelled" in obj &&
        typeof obj.cancelled === "boolean"
    );
}
