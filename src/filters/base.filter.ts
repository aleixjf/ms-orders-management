import {ArgumentsHost, ExceptionFilter, Logger} from "@nestjs/common";

import {Request, Response} from "express";

import {Context} from "@enums/context.enum";

import {customHttpError} from "@filters/responses/http.response";
import {customRpcError} from "@filters/responses/rpc.response";

export class CustomExceptionFilter<T> implements ExceptionFilter {
    readonly logger: Logger = new Logger(this.constructor.name);

    catch(exception: T, host: ArgumentsHost) {
        this.logException(exception, host);

        switch (host.getType()) {
            case "http":
                return this.handleHttpContext(exception, host);
            case "rpc":
                return this.handleRpcContext(exception, host);
            case "ws":
                return this.handleWsContext(exception, host);
            default:
                this.logger.debug(
                    "Unknown host type, exception won't be handled"
                );
                return;
        }
    }

    private handleHttpContext(exception: T, host: ArgumentsHost) {
        this.logger.debug(
            "Transforming to HTTP exception and throwing error..."
        );
        const ctx = host.switchToHttp();

        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const code = this.code(exception, Context.HTTP);
        const status = this.status(exception);
        const name = this.name(exception);
        const message = this.message(exception);
        const cause = this.cause(exception);

        // Customized response for HTTP errors in HTTP context
        response.status(code).json(
            customHttpError({
                code,
                status,
                exception: name,
                message,
                cause,
                request,
            })
        );
    }

    private handleRpcContext(exception: T, host: ArgumentsHost) {
        this.logger.debug(
            "Transforming to RPC exception and throwing error..."
        );
        const ctx = host.switchToRpc();

        const code = this.code(exception, Context.RPC);
        const status = this.status(exception);
        const message = this.message(exception);
        const cause = this.cause(exception);

        // Customized response for HTTP errors in RPC context
        /*
        // ! This doesn't throw the code correctly, it always throws 2 (UNKNOWN)
        throw new RpcException({
            code: http2grpc(exception.getStatus()) || grpc.status.INTERNAL,
            message: `Message: ${exception.message};\nCause: ${cause}`,
        });
        */
        throw customRpcError({
            code,
            cause,
            message,
        });
    }

    private handleWsContext(exception: T, host: ArgumentsHost) {
        this.logger.debug(
            "Transforming to WebSocket exception and throwing error..."
        );
        const ctx = host.switchToWs();

        // Customized response for HTTP errors in WebSocket context
        throw exception;
    }

    logException(exception: T, host: ArgumentsHost): void {
        this.logger.error(
            `Caught an exception: ${exception.constructor.name} (Context: ${host.getType()})`,
            exception
        );
    }

    // ? Override these methods in the derived classes
    code(exception: T, context: Context): number {
        return 0;
    }

    status(exception: T): string | undefined {
        return undefined;
    }

    name(exception: T): string {
        return exception.constructor.name;
    }

    message(exception: T): string | undefined {
        return undefined;
    }

    cause(exception: T): any | undefined {
        return undefined;
    }
}
