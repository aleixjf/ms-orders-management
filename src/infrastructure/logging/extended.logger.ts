import {ConsoleLogger, LogLevel} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";

import * as winston from "winston";

import {Environment} from "@enums/environment.enum";

import {createWinstonTransports} from "@infrastructure/logging/factories/winston.factory";

export class ExtendedLogger extends ConsoleLogger {
    private winstonLogger: winston.Logger | undefined;
    private mode: "Nest" | "Custom";
    private stackLinesInConsole: number | "default" | "none";

    constructor(
        context: string, // ? NestJS injects this automatically when using `Logger.setLogger(new ExtendedLogger())`
        private readonly configService: ConfigService, // ? Inject ConfigService
        options?: {
            console?: "Nest" | "Custom";
            stackLinesInConsole?: number | "default" | "none";
        }
    ) {
        super(context, {
            // Pass options to ConsoleLogger base for Nest's default behavior
            logLevels: configService.get<LogLevel[]>(
                "LOG_LEVELS_FOR_NEST_CONSOLE"
            ) || ["log", "error", "warn", "debug", "verbose"],
        });

        this.mode = options?.console || "Nest";
        this.stackLinesInConsole = options?.stackLinesInConsole || "default"; // Default to "default"

        const saveLogs =
            this.configService.get<boolean>("logger.save") || false;
        const streamLogs =
            this.configService.get<boolean>("logger.stream") || false;

        // Initialize Winston logger only if custom console or saving/streaming logs is enabled
        if (this.mode === "Custom" || saveLogs || streamLogs) {
            this.winstonLogger = winston.createLogger({
                level: this.configService.get<string>("LOG_LEVEL", "info"),
                format: winston.format.json(), // Standard format for file/stream
                defaultMeta: {
                    service: this.configService.get<string>(
                        "APP_NAME",
                        "ms-orders-management"
                    ),
                    context: context,
                },
                transports: createWinstonTransports({
                    useCustomConsole: this.mode === "Custom",
                    saveLogs: saveLogs,
                    streamLogs: streamLogs,
                    logLevel: this.configService.get<string>(
                        "logger.level",
                        "info"
                    ),
                    logLevelHttp: this.configService.get<string>(
                        "LOG_LEVEL_HTTP",
                        this.configService.get<string>("LOG_LEVEL", "info")
                    ),
                    logsPath: this.configService.get<string>(
                        "logger.path",
                        "./logs"
                    ),
                    maxLogSize: this.configService.get<string>(
                        "logger.maxSize",
                        "10m"
                    ),
                    deleteLogsAfterXDays: this.configService.get<number>(
                        "logger.deleteAfter",
                        14
                    ),
                    logstashURL: this.configService.get<string>(
                        "logger.streamURL",
                        "localhost"
                    ),
                    appName: this.configService.get<string>(
                        "APP_NAME",
                        "ms-orders-management"
                    ),
                    nodeEnv: this.configService.get<string>(
                        "environment",
                        Environment.Development
                    ),
                }),
                exitOnError: false,
            });
        }
    }

    private processLogArguments(optionalParams: any[]): {
        data: any[];
        context: string | undefined;
        stack: string | undefined;
    } {
        const clonedParams = [...optionalParams];
        let context: string | undefined = undefined;
        let stack: string | undefined = undefined;
        let data: any[] = [];

        // Try to extract context (last string param)
        if (
            clonedParams.length > 0 &&
            typeof clonedParams[clonedParams.length - 1] === "string"
        ) {
            context = clonedParams.pop();
        } else if (clonedParams.length === 0 && this.context) {
            // Use constructor context if no specific context provided
            context = this.context;
        }

        // For error logs, try to extract stack (second to last string param or an object with 'stack')
        if (this.context === "error" && clonedParams.length > 0) {
            // Using this.context as a proxy for the actual log level being processed
            const lastParam = clonedParams[clonedParams.length - 1];
            if (typeof lastParam === "string" && lastParam.includes("\n")) {
                stack = clonedParams.pop();
            } else if (
                typeof lastParam === "object" &&
                lastParam &&
                "stack" in lastParam
            ) {
                stack = lastParam.stack;
                clonedParams.pop();
            }
        }

        data = clonedParams; // Remaining parameters are 'data'

        return {data, context, stack};
    }

    // Override log methods
    verbose(message: any, ...optionalParams: [...any, string?]) {
        const {data, context} = this.processLogArguments(optionalParams);
        this.winstonLogger?.verbose(message, {
            context,
            data: data.length === 1 ? data[0] : data,
        });
        if (this.mode === "Nest") super.verbose(message, ...optionalParams);
    }

    debug(message: any, ...optionalParams: [...any, string?]) {
        const {data, context} = this.processLogArguments(optionalParams);
        this.winstonLogger?.debug(message, {
            context,
            data: data.length === 1 ? data[0] : data,
        });
        if (this.mode === "Nest") super.debug(message, ...optionalParams);
    }

    log(message: any, ...optionalParams: [...any, string?]) {
        const {data, context} = this.processLogArguments(optionalParams);
        this.winstonLogger?.info(message, {
            context,
            data: data.length === 1 ? data[0] : data,
        });
        if (this.mode === "Nest") super.log(message, ...optionalParams);
    }

    warn(message: any, ...optionalParams: [...any, string?]) {
        const {data, context} = this.processLogArguments(optionalParams);
        this.winstonLogger?.warn(message, {
            context,
            data: data.length === 1 ? data[0] : data,
        });
        if (this.mode === "Nest") super.warn(message, ...optionalParams);
    }

    error(message: any, ...optionalParams: [...any, string?, string?]) {
        const {data, context, stack} = this.processLogArguments(optionalParams);
        this.winstonLogger?.error(message, {
            context,
            data: data.length === 1 ? data[0] : data,
            stack,
        });

        if (this.mode === "Nest") {
            let processedStack = stack;
            if (
                processedStack &&
                typeof this.stackLinesInConsole === "number" &&
                this.stackLinesInConsole > 0
            ) {
                processedStack = processedStack
                    .split("\n")
                    .slice(0, this.stackLinesInConsole)
                    .join("\n");
            } else if (this.stackLinesInConsole === "none") {
                processedStack = undefined;
            }

            // Adjust parameters for super.error based on processed data and stack
            const superParams: any[] = [message];
            if (processedStack) superParams.push(processedStack);
            if (data && data.length > 0) {
                superParams.push(data.length === 1 ? data[0] : data);
            }
            if (context) superParams.push(context);

            super.error(superParams);
        }
    }
}
