import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

import {
    ILoggerTransport,
    LogInfo,
} from "@infrastructure/logging/interfaces/logging.interfaces";

export interface DailyRotateFileTransportOptions {
    level: string;
    dirname: string;
    filename: string;
    extension?: string;
    datePattern?: string;
    maxSize?: string;
    maxFiles?: string | number;
    format?: winston.Logform.Format;
    options?: {flags?: string};
}

export class DailyRotateFileTransport
    extends DailyRotateFile
    implements ILoggerTransport
{
    constructor(options: DailyRotateFileTransportOptions) {
        super({
            level: options.level,
            dirname: options.dirname,
            filename: options.filename,
            extension: options.extension || ".log",
            datePattern: options.datePattern || "YYYY-MM-DD",
            maxSize: options.maxSize,
            maxFiles: options.maxFiles,
            format: options.format,
            options: options.options,
        });
    }

    log(info: LogInfo, callback: () => void): void {
        super.log(info, callback);
    }
}
