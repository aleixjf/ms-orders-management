import {HttpStatus} from "@nestjs/common";

import {status as Status} from "@grpc/grpc-js";

export function http2grpc(status: number) {
    switch (true) {
        // ? https://developer.mozilla.org/es/docs/Web/HTTP/Status#respuestas_informativas
        case status >= 100 && status < 200:
            switch (status) {
                case HttpStatus.CONTINUE:
                    return Status.OK;
                case HttpStatus.SWITCHING_PROTOCOLS:
                    return Status.CANCELLED;
                case HttpStatus.PROCESSING:
                    return Status.UNKNOWN;
                case HttpStatus.EARLYHINTS:
                    return Status.UNKNOWN;
                default:
                    return Status.UNKNOWN;
            }
        case status >= 200 && status < 300:
            // ? Success: https://developer.mozilla.org/es/docs/Web/HTTP/Status#respuestas_satisfactorias
            switch (status) {
                case HttpStatus.OK:
                    return Status.OK;
                case HttpStatus.CREATED:
                    return Status.OK;
                case HttpStatus.ACCEPTED:
                    return Status.UNKNOWN;
                case HttpStatus.NON_AUTHORITATIVE_INFORMATION:
                    return Status.UNKNOWN;
                case HttpStatus.NO_CONTENT:
                    return Status.UNKNOWN;
                case HttpStatus.RESET_CONTENT:
                    return Status.UNKNOWN;
                case HttpStatus.PARTIAL_CONTENT:
                    return Status.UNKNOWN;
                default:
                    return Status.UNKNOWN;
            }
        case status >= 300 && status < 400:
            // ? Redirects: https://developer.mozilla.org/es/docs/Web/HTTP/Status#redirecciones
            switch (status) {
                case HttpStatus.AMBIGUOUS:
                    return Status.UNKNOWN;
                case HttpStatus.MOVED_PERMANENTLY:
                    return Status.UNKNOWN;
                case HttpStatus.FOUND:
                    return Status.UNKNOWN;
                case HttpStatus.SEE_OTHER:
                    return Status.UNKNOWN;
                case HttpStatus.NOT_MODIFIED:
                    return Status.UNKNOWN;
                case HttpStatus.TEMPORARY_REDIRECT:
                    return Status.UNKNOWN;
                case HttpStatus.PERMANENT_REDIRECT:
                    return Status.UNKNOWN;
                default:
                    return Status.UNKNOWN;
            }
        case status >= 400 && status < 500:
            // ? Client errors: https://developer.mozilla.org/es/docs/Web/HTTP/Status#errores_de_cliente
            switch (status) {
                case HttpStatus.BAD_REQUEST:
                    return Status.INVALID_ARGUMENT;
                case HttpStatus.UNAUTHORIZED:
                    return Status.UNAUTHENTICATED;
                case HttpStatus.PAYMENT_REQUIRED:
                    return Status.UNKNOWN;
                case HttpStatus.FORBIDDEN:
                    return Status.PERMISSION_DENIED;
                case HttpStatus.NOT_FOUND:
                    return Status.NOT_FOUND;
                case HttpStatus.METHOD_NOT_ALLOWED:
                    return Status.UNKNOWN;
                case HttpStatus.NOT_ACCEPTABLE:
                    return Status.UNKNOWN;
                case HttpStatus.PROXY_AUTHENTICATION_REQUIRED:
                    return Status.UNKNOWN;
                case HttpStatus.REQUEST_TIMEOUT:
                    return Status.DEADLINE_EXCEEDED;
                case HttpStatus.CONFLICT:
                    return Status.ALREADY_EXISTS;
                case HttpStatus.GONE:
                    return Status.UNKNOWN;
                case HttpStatus.LENGTH_REQUIRED:
                    return Status.UNKNOWN;
                case HttpStatus.PRECONDITION_FAILED:
                    return Status.UNKNOWN;
                case HttpStatus.PAYLOAD_TOO_LARGE:
                    return Status.OUT_OF_RANGE;
                case HttpStatus.URI_TOO_LONG:
                    return Status.UNKNOWN;
                case HttpStatus.UNSUPPORTED_MEDIA_TYPE:
                    return Status.UNKNOWN;
                case HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE:
                    return Status.UNKNOWN;
                case HttpStatus.EXPECTATION_FAILED:
                    return Status.UNKNOWN;
                case HttpStatus.I_AM_A_TEAPOT:
                    return Status.UNKNOWN;
                case HttpStatus.MISDIRECTED:
                    return Status.UNKNOWN;
                case HttpStatus.UNPROCESSABLE_ENTITY:
                    return Status.INVALID_ARGUMENT;
                case HttpStatus.FAILED_DEPENDENCY:
                    return Status.UNKNOWN;
                case HttpStatus.PRECONDITION_REQUIRED:
                    return Status.FAILED_PRECONDITION;
                case HttpStatus.TOO_MANY_REQUESTS:
                    return Status.RESOURCE_EXHAUSTED;
                default:
                    return Status.UNKNOWN;
            }
        case status >= 500 && status < 600:
            // ? Server errors: https://developer.mozilla.org/es/docs/Web/HTTP/Status#errores_de_servidor
            switch (status) {
                case HttpStatus.INTERNAL_SERVER_ERROR:
                    return Status.INTERNAL;
                case HttpStatus.NOT_IMPLEMENTED:
                    return Status.UNIMPLEMENTED;
                case HttpStatus.BAD_GATEWAY:
                    return Status.UNKNOWN;
                case HttpStatus.SERVICE_UNAVAILABLE:
                    return Status.UNAVAILABLE;
                case HttpStatus.GATEWAY_TIMEOUT:
                    return Status.UNKNOWN;
                case HttpStatus.HTTP_VERSION_NOT_SUPPORTED:
                    return Status.UNKNOWN;
                default:
                    return Status.UNKNOWN;
            }
        default:
            return Status.UNKNOWN;
    }
}
