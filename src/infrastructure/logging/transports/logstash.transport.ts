import * as net from "net";

import transport from "winston-transport";

import {
    ILoggerTransport,
    LogInfo,
} from "@infrastructure/logging/interfaces/logging.interfaces";

export interface LogstashTransportOptions {
    url: string;
    level?: string;
    appName: string;
}

export class LogstashTransport extends transport implements ILoggerTransport {
    private readonly socket: net.Socket;
    private readonly appName: string;
    private isConnected = false;
    private connectionTimeout: NodeJS.Timeout | null = null;

    constructor(options: LogstashTransportOptions) {
        super(options);
        this.appName = options.appName;

        this.socket = new net.Socket();
        this.setupSocketListeners();
        const {host, port} = new URL(options.url);
        this.connect(host, parseInt(port));
    }

    private setupSocketListeners(): void {
        this.socket.on("connect", () => {
            this.isConnected = true;
            console.log(
                `[LogstashTransport] Connected to Logstash (${this.appName})`
            );
            if (this.connectionTimeout) {
                clearTimeout(this.connectionTimeout);
                this.connectionTimeout = null;
            }
        });

        this.socket.on("error", (err: Error) => {
            this.isConnected = false;
            console.error(
                `[LogstashTransport] Error connecting/sending to Logstash (${this.appName}):`,
                err.message
            );
            this.scheduleReconnection();
        });

        this.socket.on("close", () => {
            this.isConnected = false;
            console.warn(
                `[LogstashTransport] Disconnected from Logstash (${this.appName})`
            );
            this.scheduleReconnection();
        });
    }

    private connect(host: string, port: number): void {
        try {
            this.socket.connect(port, host);
        } catch (error) {
            console.error(
                `[LogstashTransport] Failed to connect to Logstash:`,
                error
            );
            this.scheduleReconnection();
        }
    }

    private scheduleReconnection(): void {
        if (this.connectionTimeout) return;

        this.connectionTimeout = setTimeout(() => {
            this.connectionTimeout = null;
            const {host, port} = this.socket.remoteAddress
                ? {
                      host: this.socket.remoteAddress,
                      port: this.socket.remotePort || 5000,
                  }
                : {host: "localhost", port: 5000};
            this.connect(host, port);
        }, 5000); // Retry every 5 seconds
    }

    log(info: LogInfo, callback: () => void): void {
        setImmediate(() => {
            this.emit("logged", info);
        });

        const transformedInfo = {
            timestamp: new Date().toISOString(),
            level: info.level,
            message: info.message,
            context: info.context || this.appName,
            data: info.data
                ? Array.isArray(info.data) && info.data.length === 1
                    ? info.data[0]
                    : info.data
                : undefined,
            stack: info.stack,
            ...info,
        };

        if (this.isConnected) {
            try {
                const logMessage = JSON.stringify(transformedInfo) + "\n";
                this.socket.write(logMessage);
            } catch (error) {
                console.error(
                    `[LogstashTransport] Failed to send log to Logstash:`,
                    error
                );
            }
        }

        callback();
    }

    close(): void {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
        if (this.socket && !this.socket.destroyed) {
            this.socket.destroy();
        }
    }
}
