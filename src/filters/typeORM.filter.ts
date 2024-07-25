import {Catch, HttpStatus} from "@nestjs/common";

import * as grpc from "@grpc/grpc-js";
import {
    CannotCreateEntityIdMapError,
    EntityNotFoundError,
    QueryFailedError,
    TypeORMError,
} from "typeorm";

import {Context} from "@enums/context.enum";

import {CustomExceptionFilter} from "@filters/base.filter";

type Exception =
    | TypeORMError
    | QueryFailedError
    | EntityNotFoundError
    | CannotCreateEntityIdMapError;
@Catch(
    TypeORMError,
    QueryFailedError,
    EntityNotFoundError,
    CannotCreateEntityIdMapError
)
export class TypeORMExceptionFilter extends CustomExceptionFilter<Exception> {
    // export class TypeORMExceptionFilter extends InternalExceptionFilter {
    code(exception: Exception, context: Context): number {
        switch (context) {
            case Context.RPC:
                return grpc.status.INTERNAL;
            case Context.HTTP:
            case Context.WS:
            default:
                return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    status(exception: Exception): string {
        return "Internal Server Error";
    }

    message(exception: Exception): string {
        return exception.message || "TypeORM error";
    }
}
