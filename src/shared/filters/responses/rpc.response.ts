import {status as gRPCStatus} from "@grpc/grpc-js";

export interface CustomRpcError {
    code: number;
    message: string;
}

export const customRpcError = ({
    code = gRPCStatus.INTERNAL,
    message = "An unexpected error occurred",
    cause,
}: {
    code?: number;
    message?: string;
    cause?: any;
}): CustomRpcError => ({
    code,
    message:
        message && cause
            ? `Message: ${message};\nCause: ${JSON.stringify(cause)}`
            : message || cause || "An unexpected error occurred",
});
