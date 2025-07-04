import {HttpStatus} from "@nestjs/common";

import {status as gRPCStatus} from "@grpc/grpc-js";

export class DomainError extends Error {
    constructor(message: string, cause?: unknown) {
        super(message, {cause});
        this.name = "DomainError";
    }

    httpStatus(): HttpStatus {
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    rpcStatus(): gRPCStatus {
        return gRPCStatus.INTERNAL;
    }
}
