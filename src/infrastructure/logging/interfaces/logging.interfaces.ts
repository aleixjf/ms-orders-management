export interface ILoggerTransport {
    log(info: LogInfo, callback: () => void): void;
}

export interface LogInfo {
    level: string;
    message: string;
    context?: string;
    data?: unknown;
    stack?: string;
    timestamp?: string;
    [key: string]: unknown;
}

export interface LoggingConfig {
    useCustomConsole: boolean;
    saveLogs: boolean;
    streamLogs: boolean;
    logLevel: string;
    logLevelHttp: string;
    logsPath: string;
    maxLogSize?: string;
    deleteLogsAfterXDays?: number;
    logstashURL: string;
    appName: string;
    nodeEnv: string;
}

export interface LogContextRule {
    tag: string;
    include?: "contains" | "exact";
    exclude?: "contains" | "exact";
}
