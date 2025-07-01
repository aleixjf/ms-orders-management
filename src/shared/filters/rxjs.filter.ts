import {Catch, HttpStatus} from "@nestjs/common";

import {TimeoutError} from "rxjs";

import {status as gRPCStatus} from "@grpc/grpc-js";

import {Context} from "@enums/context.enum";

import {CustomExceptionFilter} from "@filters/base.filter";

type Exception = TimeoutError;
@Catch(TimeoutError)
export class RxJSExceptionFilter extends CustomExceptionFilter<Exception> {
    code(exception: Exception, context: Context): number {
        switch (true) {
            case exception instanceof TimeoutError:
                switch (context) {
                    case Context.RPC:
                        return gRPCStatus.RESOURCE_EXHAUSTED;
                    case Context.HTTP:
                    case Context.WS:
                    default:
                        return HttpStatus.REQUEST_TIMEOUT;
                }
            default:
                switch (context) {
                    case Context.RPC:
                        return gRPCStatus.RESOURCE_EXHAUSTED;
                    case Context.HTTP:
                    case Context.WS:
                    default:
                        return HttpStatus.REQUEST_TIMEOUT;
                }
        }
    }

    status(exception: Exception): string {
        return exception.name;
    }

    message(exception: Exception): string {
        return exception.message || "RxJS error";
    }
}
