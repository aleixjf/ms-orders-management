import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

import {stringify} from "@utils/string.utils";

import {Environment} from "@enums/environment.enum";
import {NodeLevel} from "@enums/log-level.enum";

import {LogstashTransport} from "@infrastructure/logging/transports/logstash.transport"; // Import the custom transport

interface WinstonLoggerConfig {
    useCustomConsole: boolean;
    saveLogs: boolean;
    streamLogs: boolean;
    logLevel: string;
    logLevelHttp: string;
    logsPath: string;
    maxLogSize: string | undefined;
    deleteLogsAfterXDays: number | undefined;
    logstashURL: string;
    appName: string; // Add appName for Logstash
    nodeEnv: string;
}

interface CustomTag {
    tag: string;
    level?: NodeLevel;
    include?: "contains" | "exact";
    exclude?: "contains" | "exact";
}

export function createWinstonTransports(
    config: WinstonLoggerConfig
): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console logger
    if (config.useCustomConsole) {
        transports.push(
            new winston.transports.Console({
                level:
                    config.nodeEnv === Environment.Production
                        ? config.logLevel
                        : NodeLevel.Verbose,
                format: winston.format.combine(
                    winston.format.timestamp({
                        format: "YYYY-MM-DD HH:mm:ss",
                    }),
                    winston.format.colorize(),
                    winston.format.printf((info) => customFormat(info))
                ),
            })
        );
    }

    // File logger
    if (config.saveLogs) {
        // Main daily rotating file
        transports.push(
            new DailyRotateFile({
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
                format: winston.format.combine(
                    winston.format((info) =>
                        customContexts(info, [
                            {tag: "HTTP", exclude: "contains"},
                            {tag: "Socket.io", exclude: "contains"},
                            {tag: "S3", exclude: "contains"},
                        ])
                    )(),
                    winston.format.timestamp({format: "HH:mm:ss"}),
                    winston.format.printf((info) => customFormat(info))
                ),
            })
        );
        // HTTP logs
        transports.push(
            new DailyRotateFile({
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
                format: winston.format.combine(
                    winston.format((info) =>
                        customContexts(info, [
                            {tag: "HTTP", include: "contains"},
                        ])
                    )(),
                    winston.format.timestamp({format: "HH:mm:ss"}),
                    winston.format.printf((info) => customFormat(info))
                ),
            })
        );
        // Monthly rotating file for warnings & errors
        transports.push(
            new DailyRotateFile({
                level: NodeLevel.Warn,
                dirname: `${config.logsPath}/errors`,
                filename: `%DATE%`,
                extension: ".log",
                datePattern: "YYYY-MM",
                maxSize: config.maxLogSize,
                maxFiles: 12,
                options:
                    config.nodeEnv !== Environment.Production
                        ? {flags: "w"}
                        : undefined,
                format: winston.format.combine(
                    winston.format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
                    winston.format.printf((info) => customFormat(info))
                ),
            })
        );
    }

    // ELK stack (Logstash)
    if (config.streamLogs) {
        transports.push(
            new LogstashTransport({
                url: config.logstashURL,
                level: config.logLevel, // Or a specific level for Logstash
                appName: config.appName,
            })
        );
    }

    return transports;
}

const customFormat = (info: winston.Logform.TransformableInfo) => {
    const {timestamp, level, message, context, data, stack, ...args} = info;

    const customLevelTag = () => {
        switch (level) {
            case "verbose":
                return "trace";
            default:
                return level;
        }
    };

    let output = `[${timestamp}] ${customLevelTag()
        .toUpperCase()
        .padEnd(5, " ")} [${context}] ${message}`;
    if (data) {
        switch (true) {
            case Array.isArray(data) && data.length > 0:
                // output = `${output}\n${stringify(data.length === 1 ? data[0] : data)}`;
                output = `${output}\n${stringify(data)}`;
                break;
            case typeof data === "object":
                if (Object.keys(data).length > 0)
                    output = `${output}\n${stringify(data)}`;
                break;
            default:
                break;
        }
    }

    if (Object.keys(args).length) {
        output = `${output}\nAdditional arguments:\n${JSON.stringify(
            args,
            null,
            2
        )}`;
    }

    if (stack) {
        // output = `${output}\nStack trace:\n${stack}`;
        output = `${output}\n${stack}`;
    }

    return output;
};

const customContexts = (
    info: winston.Logform.TransformableInfo,
    rules: CustomTag[]
): winston.Logform.TransformableInfo | false => {
    // Using your preferred destructuring from the input 'info' object
    const {timestamp, level, message, context, data, stack, ...args} = info;
    const tag: string = (context as string | null | undefined) ?? "console";

    let isExcludedByRule = false;
    let meetsAnIncludeRule = false; // True if an applicable include rule is matched by the log
    let hasAnyApplicableIncludeRule = false; // True if any include rule is applicable by level

    for (const rule of rules) {
        // If the rule specifies a level and it doesn't match the log's current level, skip this rule.
        if (rule.level && rule.level !== level) continue;

        // Check for EXCLUSION by this rule.
        // If an exclusion rule matches, mark for exclusion and stop processing further rules.
        if (rule.exclude) {
            if (
                (rule.exclude === "exact" && rule.tag === tag) ||
                (rule.exclude === "contains" && tag.includes(rule.tag))
            ) {
                isExcludedByRule = true;
                break;
            }
        }

        // Check for INCLUSION by this rule.
        // This rule is applicable by level if this point is reached.
        if (rule.include) {
            hasAnyApplicableIncludeRule = true; // Note that an include rule is in play for this log's level
            if (
                (rule.include === "exact" && rule.tag === tag) ||
                (rule.include === "contains" && tag.includes(rule.tag))
            ) {
                meetsAnIncludeRule = true;
                // We don't 'break' here because a later rule might still cause an exclusion,
                // and the 'isExcludedByRule' flag (checked after the loop) handles that precedence.
            }
        }
    }

    // Final decision based on the flags:

    // 1. If any rule explicitly excluded the log:
    if (isExcludedByRule) {
        return false;
    }

    // 2. If no exclusion, but there were applicable include rules, at least one must have been met.
    //    If no include rules were applicable to this log's level, this condition is skipped,
    //    and the log passes by default (as it wasn't excluded).
    if (hasAnyApplicableIncludeRule && !meetsAnIncludeRule) {
        return false;
    }

    // If the log was not excluded and met inclusion criteria (if any were applicable)
    return {...info, context: tag};
};

export function createExceptionLoggerTransport(config: {
    logsPath: string;
}): winston.transport {
    return new winston.transports.File({
        level: NodeLevel.Error,
        dirname: `${config.logsPath}`,
        filename: "UncaughtExceptions.log",
    });
}
