import winston from "winston";

import {
    getConsoleFormat,
    getFileFormat,
} from "@infrastructure/logging/utils/format.utils";

import {Environment} from "@enums/environment.enum";
import {NodeLevel} from "@enums/log-level.enum";

import {LoggingConfig} from "@infrastructure/logging/interfaces/logging.interfaces";
import {
    ConsoleTransport,
    DailyRotateFileTransport,
    LogstashTransport,
} from "@infrastructure/logging/transports";

export class WinstonTransportFactory {
    static createTransports(config: LoggingConfig): winston.transport[] {
        const transports: winston.transport[] = [];

        if (config.useCustomConsole) {
            transports.push(this.createConsoleTransport(config));
        }

        if (config.saveLogs) {
            transports.push(...this.createFileTransports(config));
        }

        if (config.streamLogs) {
            transports.push(this.createLogstashTransport(config));
        }

        return transports;
    }

    private static createConsoleTransport(
        config: LoggingConfig
    ): ConsoleTransport {
        return new ConsoleTransport({
            level:
                config.nodeEnv === Environment.Production
                    ? config.logLevel
                    : NodeLevel.Verbose,
            format: getConsoleFormat(),
        });
    }

    private static createFileTransports(
        config: LoggingConfig
    ): DailyRotateFileTransport[] {
        const transports: DailyRotateFileTransport[] = [];

        // Main daily rotating file
        transports.push(
            new DailyRotateFileTransport({
                level: config.logLevel,
                dirname: `${config.logsPath}/daily`,
                filename: "%DATE%",
                extension: ".log",
                datePattern: "YYYY-MM-DD",
                maxSize: config.maxLogSize,
                maxFiles: config.deleteLogsAfterXDays
                    ? `${config.deleteLogsAfterXDays}d`
                    : undefined,
                options:
                    config.nodeEnv !== Environment.Production
                        ? {flags: "w"}
                        : undefined,
                format: getFileFormat([
                    {tag: "HTTP", exclude: "contains"},
                    {tag: "Socket.io", exclude: "contains"},
                    {tag: "S3", exclude: "contains"},
                ]),
            })
        );

        // HTTP logs
        transports.push(
            new DailyRotateFileTransport({
                level: config.logLevelHttp,
                dirname: `${config.logsPath}/daily`,
                filename: "HTTP %DATE%",
                extension: ".log",
                datePattern: "YYYY-MM-DD",
                maxSize: config.maxLogSize,
                maxFiles: config.deleteLogsAfterXDays
                    ? `${config.deleteLogsAfterXDays}d`
                    : undefined,
                options:
                    config.nodeEnv !== Environment.Production
                        ? {flags: "w"}
                        : undefined,
                format: getFileFormat([{tag: "HTTP", include: "contains"}]),
            })
        );

        // Monthly rotating file for warnings & errors
        transports.push(
            new DailyRotateFileTransport({
                level: NodeLevel.Warn,
                dirname: `${config.logsPath}/errors`,
                filename: "%DATE%",
                extension: ".log",
                datePattern: "YYYY-MM",
                maxSize: config.maxLogSize,
                maxFiles: 12,
                options:
                    config.nodeEnv !== Environment.Production
                        ? {flags: "w"}
                        : undefined,
                format: winston.format.combine(
                    winston.format.timestamp({
                        format: "YYYY-MM-DD HH:mm:ss",
                    }),
                    winston.format.printf(
                        (info) =>
                            `[${info.timestamp}] [${info.level.toUpperCase()}] ${
                                info.message
                            }`
                    )
                ),
            })
        );

        return transports;
    }

    private static createLogstashTransport(
        config: LoggingConfig
    ): LogstashTransport {
        return new LogstashTransport({
            url: config.logstashURL,
            level: config.logLevel,
            appName: config.appName,
        });
    }

    static createExceptionTransport(logsPath: string): winston.transport {
        return new winston.transports.File({
            level: NodeLevel.Error,
            dirname: logsPath,
            filename: "UncaughtExceptions.log",
        });
    }
}
