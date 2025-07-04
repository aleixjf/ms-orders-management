import winston from "winston";

import {
    ILoggerTransport,
    LogInfo,
} from "@infrastructure/logging/interfaces/logging.interfaces";

export interface ConsoleTransportOptions {
    level: string;
    format?: winston.Logform.Format;
}

export class ConsoleTransport
    extends winston.transports.Console
    implements ILoggerTransport
{
    constructor(options: ConsoleTransportOptions) {
        super({
            level: options.level,
            format: options.format,
        });
    }

    log(info: LogInfo, callback: () => void): void {
        super.log(info, callback);
    }
}
