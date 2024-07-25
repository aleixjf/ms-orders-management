import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {RpcException} from "@nestjs/microservices";

import {Observable, throwError} from "rxjs";
import {delay, map, mergeMap, retryWhen, tap, timeout} from "rxjs/operators";

import * as grpc from "@grpc/grpc-js";
import {Metadata} from "@grpc/grpc-js";
import {deadlineToString} from "@grpc/grpc-js/build/src/deadline";

import {Context} from "@enums/context.enum";

import {gRPCCall, isgRPCCall} from "./interfaces/grpc.call.interface";

@Injectable()
export class gRPCInterceptor implements NestInterceptor {
    private readonly logger = new Logger(gRPCInterceptor.name);

    constructor(private readonly configService: ConfigService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (context.getType() !== Context.RPC) return next.handle();

        const isgRPC: boolean =
            context.getArgs().length === 3 &&
            context.getArgByIndex(0) instanceof Object &&
            context.getArgByIndex(1) instanceof Metadata &&
            isgRPCCall(context.getArgByIndex(2));
        if (!isgRPC) {
            console.debug(
                "An RPC call has been intercepted, but isn't a gRPC call. Skipping interceptor.",
                context.getArgs()
            );
            return next.handle();
        }

        const [data, metadata, call] = context.getArgs() as [
            object,
            Metadata,
            gRPCCall,
        ];
        this.logger.debug("Intercepted gRPC call", {
            // method: call.getPath().substring(1),
            handler: `${context.getClass().name}.${context.getHandler().name}`,
            data: context.switchToRpc().getData(),
            origin: call.getPeer(),
            deadline:
                call.getDeadline() && call.getDeadline() !== Infinity
                    ? deadlineToString(call.getDeadline())
                    : undefined, // call.getDeadline() ? new Date(call.getDeadline()) : undefined,
        });

        return next.handle().pipe(
            // ? Apply timeout to the request
            timeout(this.timeout(metadata, call)),
            // ? Transform response to gRPC response
            map((response) => {
                if (response === null)
                    // ! gRPC expects no response to be returned for null responses as defined in the proto file (message Empty)
                    return;
                switch (typeof response) {
                    case "undefined": // ! gRPC expects no response to be returned for null responses as defined in the proto file (message Empty)
                        return;
                    case "object":
                        if (response instanceof Buffer)
                            // ! gRPC expects a Buffer to be wrapped in an object with a `content` property as defined in the proto file (message File)
                            return {
                                content: response,
                            };
                        if (Array.isArray(response))
                            // ! gRPC expects an array to be wrapped in an object with a `items` property as defined in the proto file (e.g., message Orders)
                            return {
                                items: response,
                            };
                        else return response; // ? This will be a custom object defined in the proto file, so we return it as is
                    case "boolean": // ! gRPC expects a boolean primitive value to be wrapped in an object with a `value` property as defined in the proto file (message Bool)
                    case "number": // ! gRPC expects a number primitive value to be wrapped in an object with a `value` property as defined in the proto file (message Int, message Float)
                    case "bigint": // ! gRPC expects a bigint primitive value to be wrapped in an object with a `value` property as defined in the proto file (message Int)
                    case "string": // ! gRPC expects a string primitive value to be wrapped in an object with a `value` property as defined in the proto file (message String)
                    case "symbol": // ! gRPC expects a symbol primitive value to be wrapped in an object with a `value` property as defined in the proto file (message String)
                    default:
                        // This is necessary because gRPC responses are always objects, even for primitive values
                        return {
                            value: response,
                        };
                }
            }),
            tap((response) => {
                this.logger.debug("Intercepted gRPC response", {
                    // method: call.getPath().substring(1),
                    handler: `${context.getClass().name}.${context.getHandler().name}`,
                    data: context.switchToRpc().getData(),
                    response,
                });
            }),
            // ? Transform different errors to RPC errors
            /*
            catchError((error) => {
                // ! If we handle errors here, and transform them to RpcExceptions, they won't go through the different exception filters (except the RpcException filter), since they are already handled here.
                const type = error.constructor.name || error.name || undefined;
                console.debug(`Intercepted ${type} error in RPC context`);
                switch (true) {
                    case error instanceof RpcException:
                    case error instanceof AxiosError:
                    case error instanceof HttpException:
                    case error instanceof Error:
                    default:
                        return throwError(
                            () =>
                                new RpcException({
                                    code: grpc.status.INTERNAL,
                                    message:
                                        typeof error === "string"
                                            ? error
                                            : typeof error === "object"
                                            ? error.message
                                                ? error.message
                                                : JSON.stringify(error)
                                            : "Internal error",
                                })
                        );
                }
            }),
            */
            // ? Retry on certain errors
            retryWhen((errors) =>
                errors.pipe(
                    mergeMap((error, retryCount) => {
                        switch (true) {
                            // Handle authentication errors
                            /*
                            case error.status === 16:
                                if (retryCount === 0) {
                                    return this.ordersService
                                        .authenticate()
                                        .pipe(
                                            catchError((authError) => {
                                                throw authError;
                                            }),
                                            take(1)
                                        );
                                }
                                break;
                            */

                            // Handle rate limitting errors
                            case error.status === 8:
                                if (retryCount === 0) {
                                    const retryAfter =
                                        Number(
                                            error.response?.headers[
                                                "retry-after"
                                            ]
                                        ) || 0;
                                    if (retryAfter > 0) {
                                        this.logger.log(
                                            `Rate limit exceeded. Retrying after ${retryAfter} seconds.`
                                        );
                                        return throwError(
                                            () =>
                                                new RpcException({
                                                    code: grpc.status
                                                        .RESOURCE_EXHAUSTED,
                                                    message:
                                                        "Rate limit exceeded",
                                                })
                                        ).pipe(delay(retryAfter * 1000));
                                    }
                                }
                                break;

                            default:
                                throw error;
                        }
                    })
                )
            )
        );
    }

    private timeout(metadata: Metadata, call: gRPCCall): number {
        // const custom = metadata.get("timeout")[0] || call.getDeadline() || this;
        // if (custom && !isNaN(Number(custom)))
        //     // Clamp custom timeout to reasonable bounds (1s to 5min)
        //     return Math.min(Math.max(Number(custom), 1000), 300000);

        // Check for custom timeout in metadata
        const metadataTimeout = metadata.get("timeout")[0];
        if (metadataTimeout && metadataTimeout.length > 0) {
            const custom = metadataTimeout[0];
            if (typeof custom === "string" || typeof custom === "number") {
                const timeout = Number(custom);
                if (!isNaN(timeout))
                    //     // Clamp custom timeout to reasonable bounds (1s to 5min)
                    return Math.min(Math.max(timeout, 1000), 300000);
            }
        }

        // Check gRPC call deadline
        const deadline = call.getDeadline();
        if (deadline && deadline !== Infinity) {
            const now = Date.now();
            const deadlineMs =
                typeof deadline === "number" ? deadline : deadline.getTime();
            const remainingTime = deadlineMs - now;

            if (remainingTime > 0)
                // Use the remaining time, but ensure it's at least 1 second
                return Math.max(remainingTime, 1000);
            else
                // Deadline already passed, use minimal timeout
                return 1000;
        }

        return this.configService.get<number>("GRPC_TIMEOUT") || 30000; // 30 seconds default
    }
}
