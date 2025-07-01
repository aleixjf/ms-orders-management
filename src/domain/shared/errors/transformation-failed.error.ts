import {HttpStatus} from "@nestjs/common";

import {status as gRPCStatus} from "@grpc/grpc-js";

import {DomainError} from "@domain/shared/errors/domain.error";

export class TransformationFailedError extends DomainError {
    constructor(error: any) {
        super("Transformation failed", {cause: error});
    }

    httpStatus() {
        return HttpStatus.BAD_REQUEST;
    }

    rpcStatus() {
        return gRPCStatus.INVALID_ARGUMENT;
    }
}
