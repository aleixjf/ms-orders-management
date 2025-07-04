import winston from "winston";

import {LogContextRule} from "@infrastructure/logging/interfaces/logging.interfaces";

export function customFormat(info: winston.Logform.TransformableInfo): string {
    const {timestamp, level, message, context, data, stack} = info;

    let logMessage = `[${timestamp}] [${level.toUpperCase()}]`;

    if (context) {
        logMessage += ` [${context}]`;
    }

    logMessage += ` ${message}`;

    if (data) {
        const dataStr =
            typeof data === "object"
                ? JSON.stringify(data, null, 2)
                : String(data);
        logMessage += ` | Data: ${dataStr}`;
    }

    if (stack) {
        logMessage += `\n${stack}`;
    }

    return logMessage;
}

export function customContexts(
    info: winston.Logform.TransformableInfo,
    rules: LogContextRule[]
): winston.Logform.TransformableInfo | false {
    const context = String(info.context || "");

    for (const rule of rules) {
        const matches =
            rule.include === "contains"
                ? context.includes(rule.tag)
                : context === rule.tag;

        const excludes =
            rule.exclude === "contains"
                ? context.includes(rule.tag)
                : context === rule.tag;

        if (rule.include && matches) {
            return info;
        }

        if (rule.exclude && excludes) {
            return false;
        }
    }

    return rules.some((rule) => rule.include) ? false : info;
}

export function getConsoleFormat(): winston.Logform.Format {
    return winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.colorize(),
        winston.format.printf((info) => customFormat(info))
    );
}

export function getFileFormat(
    contextRules?: LogContextRule[]
): winston.Logform.Format {
    const formats: winston.Logform.Format[] = [];

    if (contextRules) {
        formats.push(
            winston.format((info) => customContexts(info, contextRules))()
        );
    }

    formats.push(
        winston.format.timestamp({format: "HH:mm:ss"}),
        winston.format.printf((info) => customFormat(info))
    );

    return winston.format.combine(...formats);
}
