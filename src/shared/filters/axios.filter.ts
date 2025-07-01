import {ArgumentsHost, Catch} from "@nestjs/common";

import {AxiosError} from "axios";

import {Context} from "@enums/context.enum";

import {http2grpc} from "@filters/mappers/http2grpc.mapper";

import {CustomExceptionFilter} from "@filters/base.filter";

type Exception = AxiosError;
@Catch(AxiosError)
export class AxiosExceptionFilter extends CustomExceptionFilter<Exception> {
    logException(exception: AxiosError, host: ArgumentsHost): void {
        const {stack, ...error} = exception;
        this.logger.error(
            `Caught an exception: ${exception.constructor.name} (Context: ${host.getType()})`,
            error
        );
    }

    code(exception: Exception, context: Context): number {
        const code = exception.response?.status || exception.status;
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
        return exception.response?.statusText || exception.code;
    }

    message(exception: Exception): string {
        return exception.message;
    }

    cause(exception: Exception): string {
        return (
            this.getErrorMessage(exception) ||
            exception.cause?.message ||
            exception.response?.statusText
        );
    }

    private getErrorMessage(exception: Exception): string | undefined {
        if (exception.response && exception.response.data) {
            const err: any = (exception.response?.data as any)?.error;
            switch (typeof err) {
                case "object":
                    if (err.message) return err.message;
                    else if (err.error && typeof err.error === "string")
                        return err.error;
                    else return JSON.stringify(err);
                case "string":
                    return err;
                default:
                    return undefined;
            }
        }
        return undefined;
    }
}
