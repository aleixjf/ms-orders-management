import {Catch, HttpException} from "@nestjs/common";

import {Context} from "@enums/context.enum";

import {http2grpc} from "@filters/mappers/http2grpc.mapper";

import {CustomExceptionFilter} from "@filters/base.filter";

type Exception = HttpException;
@Catch(HttpException)
export class HTTPExceptionFilter extends CustomExceptionFilter<Exception> {
    code(exception: Exception, context: Context): number {
        const code =
            this.getResponse(exception).status || exception.getStatus();
        switch (context) {
            case Context.RPC:
                return http2grpc(code);
            case Context.HTTP:
            case Context.WS:
            default:
                return code;
        }
    }

    status(exception: Exception): string {
        return this.getResponse(exception).statusText;
    }

    message(exception: Exception): string {
        return this.getErrorMessage(exception) === this.status(exception)
            ? exception.message
            : this.getErrorMessage(exception);
    }

    cause(exception: Exception): any | undefined {
        return exception.cause;
    }

    private getResponse(exception: Exception): any {
        if (typeof exception.getResponse() === "object")
            return exception.getResponse() as object;
        return {
            data: exception.getResponse(),
        };
    }

    private getErrorMessage(exception: Exception): string | undefined {
        const error = this.getResponse(exception).error;
        switch (true) {
            case typeof error === "object":
                switch (true) {
                    case typeof error.message === "string":
                        return error.message;
                    case typeof error.description === "string":
                        return error.description;
                    case typeof error.error === "string":
                        return error.error;
                    default:
                        return JSON.stringify(error);
                }
            case typeof error === "string":
                return error;
            case typeof this.getResponse(exception).message === "string":
                return this.getResponse(exception).message;
            default:
                return exception.message;
        }
    }
}
