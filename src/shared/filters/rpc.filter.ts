import {Catch} from "@nestjs/common";
import {RpcException} from "@nestjs/microservices";

import {status as gRPCStatus} from "@grpc/grpc-js";

import {Context} from "@enums/context.enum";

import {grpc2http} from "@filters/mappers/grpc2http.mapper";

import {CustomExceptionFilter} from "@filters/base.filter";

type Exception = RpcException;
@Catch(RpcException)
export class RPCExceptionFilter extends CustomExceptionFilter<Exception> {
    code(exception: Exception, context: Context): number {
        const code = this.getCode(exception);
        switch (context) {
            case Context.HTTP:
                return grpc2http(code);
            case Context.RPC:
            case Context.WS:
            default:
                return code;
        }
    }

    status(exception: Exception): undefined {
        return undefined;
    }

    message(exception: Exception): string {
        return this.getErrorMessage(exception);
    }

    cause(exception: Exception): any | undefined {
        return exception.cause;
    }

    private getCode(exception: Exception): number {
        const error: any = exception.getError();
        switch (typeof error) {
            case "object":
                return error.code;
            case "string":
            default:
                return gRPCStatus.INTERNAL;
        }
    }

    private getErrorMessage(exception: Exception): string {
        const error: any = exception.getError();
        switch (typeof error) {
            case "object":
                if (error.message) return error.message;
                else if (error.error) {
                    switch (typeof error.error) {
                        case "object": {
                            const err = error.error;
                            if (err.statusText) return err.statusText;
                            else return JSON.stringify(error.error);
                        }
                        case "string":
                        default:
                            return error.error;
                    }
                }
                return JSON.stringify(error);
            case "string":
            default:
                return error;
        }
    }
}
