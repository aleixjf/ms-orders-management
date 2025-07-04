import {Catch, HttpStatus} from "@nestjs/common";

import {status as gRPCStatus} from "@grpc/grpc-js";

import {Context} from "@enums/context.enum";

import {CustomExceptionFilter} from "@filters/base.filter";

type Exception = Error;
@Catch(Error)
export class InternalExceptionFilter extends CustomExceptionFilter<Exception> {
    code(exception: Exception, context: Context): number {
        switch (context) {
            case Context.RPC:
                return gRPCStatus.INTERNAL;
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
        return exception.message || "An unexpected error occurred";
    }
}
