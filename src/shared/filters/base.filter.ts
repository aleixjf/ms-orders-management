import {
    ArgumentsHost,
    ExceptionFilter,
    HttpStatus,
    Logger,
} from "@nestjs/common";

import {Request, Response} from "express";

import {Context} from "@enums/context.enum";

import {customHttpError} from "@filters/responses/http.response";
import {customRpcError} from "@filters/responses/rpc.response";

export class CustomExceptionFilter<T> implements ExceptionFilter {
    readonly logger: Logger = new Logger(this.constructor.name);

    catch(exception: T, host: ArgumentsHost) {
        this.logException(exception, host);

        switch (host.getType()) {
            case Context.HTTP:
                return this.handleHttpContext(exception, host);
            case Context.RPC:
                return this.handleRpcContext(exception, host);
            case Context.WS:
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
        const status = this.status(exception) || this.httpStatus(code);
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

    private httpStatus(code: HttpStatus): string {
        const names: Record<number, string> = {
            100: "Continue",
            101: "Switching Protocols",
            102: "Processing",
            103: "Early Hints",
            200: "OK",
            201: "Created",
            202: "Accepted",
            203: "Non Authoritative Information",
            204: "No Content",
            205: "Reset Content",
            206: "Partial Content",
            207: "Multi Status",
            208: "Already Reported",
            226: "IM Used",
            300: "Multiple Choices",
            301: "Moved Permanently",
            302: "Found",
            303: "See Other",
            304: "Not Modified",
            305: "Use Proxy",
            307: "Temporary Redirect",
            308: "Permanent Redirect",
            400: "Bad Request",
            401: "Unauthorized",
            402: "Payment Required",
            403: "Forbidden",
            404: "Not Found",
            405: "Method Not Allowed",
            406: "Not Acceptable",
            407: "Proxy Authentication Required",
            408: "Request Timeout",
            409: "Conflict",
            410: "Gone",
            411: "Length Required",
            412: "Precondition Failed",
            413: "Content Too Large",
            414: "URI Too Long",
            415: "Unsupported Media Type",
            416: "Range Not Satisfiable",
            417: "Expectation Failed",
            418: "Im a teapot",
            421: "Misdirected Request",
            422: "Unprocessable Content",
            423: "Locked",
            424: "Failed Dependency",
            425: "Too Early",
            426: "Upgrade Required",
            428: "Precondition Required",
            429: "Too Many Requests",
            431: "Request Header Fields Too Large",
            451: "Unavailable For Legal Reasons",
            500: "Internal Server Error",
            501: "Not Implemented",
            502: "Bad Gateway",
            503: "Service Unavailable",
            504: "Gateway Timeout",
            505: "HTTP Version Not Supported",
            506: "Variant Also Negotiates",
            507: "Insufficient Storage",
            508: "Loop Detected",
            510: "Not Extended",
            511: "Network Authentication Required",
        };
        return names[code] || HttpStatus[code];
    }
}
