import {ConsoleLogger} from "@nestjs/common";

import * as winston from "winston";

import {WinstonLogger} from "./winston";

// ? With this logic, we achieve 2 things in our logger:
// #1 We keep the context in Winston when we add arguments to any method (logger.method(message, arguments))
// #2 We reduce the code output in the Nest console (if selected), by preventing duplicated lines when arguments are added to the logger method

// Also, we are cloning the optionalParams array, so we can pop the context and the stack without affecting the original array
// so that we can pass it to the super method and retain the original NestJS logger behaviour

export class ExtendedLogger extends ConsoleLogger {
    private winstonLogger: winston.Logger;
    private mode: "Nest" | "Custom";
    private stackLinesInConsole: number | "default" | "none";

    constructor(
        context?: string,
        options?: {
            console?: "Nest" | "Custom";
            stackLinesInConsole?: number | "default" | "none";
        }
    ) {
        super(context);

        this.mode = options?.console || "Nest";
        this.stackLinesInConsole = options?.stackLinesInConsole;

        if (this.mode !== "Nest" || process.env.SAVE_LOGS === "true")
            this.winstonLogger = winston.createLogger({
                transports: WinstonLogger({
                    useCustomConsole: this.mode === "Custom",
                }),
            });
    }

    log(message: any, ...optionalParams: [...any, string?]) {
        const data = [...optionalParams];
        const context = data.pop();
        // add your tailored logic here

        // Winston Logger
        this.winstonLogger?.log("info", message, {
            context,
            data,
        });

        // Nest Logger
        if (this.mode === "Nest")
            if (data && data.length > 0) {
                if (data.length === 1)
                    super.log(
                        `${message}\n${JSON.stringify(data[0], null, 2)}`,
                        context
                    );
                else
                    super.log(
                        `${message}\n${JSON.stringify(data, null, 2)}`,
                        context
                    );
            } else super.log(message, ...optionalParams);
    }

    error(message: any, ...optionalParams: [...any, string?, string?]) {
        const data = [...optionalParams];
        const context = data.pop();
        let stack;
        if (optionalParams.length > 1) {
            stack = data.pop();
            if (
                (typeof stack === "string" &&
                    stack.length > 0 &&
                    stack.includes("\n")) ||
                (typeof stack === "object" &&
                    Object.keys(stack).includes("stack"))
            ) {
                switch (typeof stack) {
                    case "object":
                        stack = stack.stack;
                        break;
                    case "string":
                    default:
                        // stack = stack.split("\n");
                        break;
                }
            } else {
                data.push(stack);
                stack = undefined;
            }
        }
        // add your tailored logic here

        // Winston Logger
        this.winstonLogger?.log("error", message, {
            context,
            data,
            stack,
        });

        // Nest Logger
        if (this.mode === "Nest") {
            if (stack)
                switch (true) {
                    case typeof this.stackLinesInConsole === "number" &&
                        this.stackLinesInConsole > 0:
                        {
                            stack = stack
                                ?.split("\n")
                                .slice(0, this.stackLinesInConsole)
                                .join("\n");
                        }
                        break;
                    case this.stackLinesInConsole === "none":
                        stack = undefined;
                        break;
                    default:
                        break;
                }

            if (data && data.length > 0) {
                if (data.length === 1)
                    if (stack)
                        if (data[0])
                            super.error(
                                `${message}\n${JSON.stringify(
                                    data[0],
                                    null,
                                    2
                                )}`,
                                stack,
                                context
                            );
                        else {
                            super.error(message, stack, context);
                        }
                    else if (data[0])
                        super.error(
                            `${message}\n${JSON.stringify(data[0], null, 2)}`,
                            context
                        );
                    else {
                        super.error(message, context);
                    }
                else if (stack)
                    super.error(
                        `${message}\n${JSON.stringify(data, null, 2)}`,
                        stack,
                        context
                    );
                else
                    super.error(
                        `${message}\n${JSON.stringify(data, null, 2)}`,
                        context
                    );
            } else super.error(message, ...optionalParams);
        }
    }

    warn(message: any, ...optionalParams: [...any, string?]) {
        const data = [...optionalParams];
        const context = data.pop();
        // add your tailored logic here

        // Winston Logger
        this.winstonLogger?.log("warn", message, {
            context,
            data,
        });

        // Nest Logger
        if (this.mode === "Nest")
            if (data && data.length > 0) {
                if (data.length === 1)
                    super.warn(
                        `${message}\n${JSON.stringify(data[0], null, 2)}`,
                        context
                    );
                else
                    super.warn(
                        `${message}\n${JSON.stringify(data, null, 2)}`,
                        context
                    );
            } else super.warn(message, ...optionalParams);
    }

    debug(message: any, ...optionalParams: [...any, string?]) {
        const data = [...optionalParams];
        const context = data.pop();
        // add your tailored logic here

        // Winston Logger
        this.winstonLogger?.log("debug", message, {
            context,
            data,
        });

        // Nest Logger
        if (this.mode === "Nest")
            if (data && data.length > 0) {
                if (data.length === 1)
                    super.debug(
                        `${message}\n${JSON.stringify(data[0], null, 2)}`,
                        context
                    );
                else
                    super.debug(
                        `${message}\n${JSON.stringify(data, null, 2)}`,
                        context
                    );
            } else super.debug(message, ...optionalParams);
    }

    verbose(message: any, ...optionalParams: [...any, string?]) {
        const data = [...optionalParams];
        const context = data.pop();
        // add your tailored logic here

        // Winston Logger
        this.winstonLogger?.log("verbose", message, {
            context,
            data,
        });

        // Nest Logger
        if (this.mode === "Nest")
            if (data && data.length > 0) {
                if (data.length === 1)
                    super.verbose(
                        `${message}\n${JSON.stringify(data[0], null, 2)}`,
                        context
                    );
                else
                    super.verbose(
                        `${message}\n${JSON.stringify(data, null, 2)}`,
                        context
                    );
            } else super.verbose(message, ...optionalParams);
    }
}

/*
? With this, we loose the context when we add arguments to any method (logger.method(message, arguments))
export class ExtendedLogger extends ConsoleLogger {
    log(message: any, context?: string) {
        // add your tailored logic here
        super.log(message, context);
    }

    error(message: any, stack?: string, context?: string) {
        // add your tailored logic here
        super.error(message, stack, context);
    }

    warn(message: any, context?: string) {
        // add your tailored logic here
        super.warn(message, context);
    }

    debug(message: any, context?: string) {
        // add your tailored logic here
        super.debug(message, context);
    }

    verbose(message: any, context?: string) {
        // add your tailored logic here
        super.verbose(message, context);
    }
}
*/
