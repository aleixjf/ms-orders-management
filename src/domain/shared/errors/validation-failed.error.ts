import {HttpStatus} from "@nestjs/common";

import {status as gRPCStatus} from "@grpc/grpc-js";
import {ValidationError} from "class-validator";

import {DomainError} from "@domain/shared/errors/domain.error";

export class ValidationFailedError extends DomainError {
    constructor(errors: ValidationError[]) {
        super("Validation failed", {cause: errors});
        this.cause = errors.map((error) => ({
            // ? Remove validation target from error
            property: error.property,
            value: error.value ?? "undefined",
            constraints: Object.values(error.constraints),
        }));
    }

    override cause: {property: string; value: string; constraints: string[]}[] =
        [];

    httpStatus() {
        return HttpStatus.BAD_REQUEST;
    }

    rpcStatus() {
        return gRPCStatus.INVALID_ARGUMENT;
    }
}
