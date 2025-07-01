import {Catch} from "@nestjs/common";

import {Context} from "@enums/context.enum";

import {DomainError} from "@domain/shared/errors/domain.error";
import {CustomExceptionFilter} from "@filters/base.filter";

type Exception = DomainError;
@Catch(DomainError)
export class DomainExceptionFilter extends CustomExceptionFilter<Exception> {
    code(exception: Exception, context: Context): number {
        switch (context) {
            case Context.RPC:
                return exception.rpcStatus();
            case Context.HTTP:
            case Context.WS:
            default:
                return exception.httpStatus();
        }
    }

    message(exception: Exception): string {
        return exception.message || "An unexpected error occurred";
    }
}
