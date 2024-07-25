import {Catch, HttpException, HttpStatus} from "@nestjs/common";

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
        return (
            this.getResponse(exception).statusText || this.statusName(exception)
        );
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

    private statusName(exception: Exception): string {
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
        return (
            names[exception.getStatus()] || HttpStatus[exception.getStatus()]
        );
    }
}
