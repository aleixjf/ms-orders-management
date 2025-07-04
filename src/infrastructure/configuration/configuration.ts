import {Environment} from "@enums/environment.enum";

export default () => ({
    environment: process.env.NODE_ENV || Environment.Development,
    useSSL: process.env.USE_SSL === "true",

    // Certificate configuration
    certificates: {
        root: process.env.CERT_ROOT_PATH,
        pairs: {
            certChain: process.env.CERT_CHAIN_PATH,
            privateKey: process.env.CERT_PRIVATE_KEY_PATH,
        },
    },

    // Logs
    logger: {
        stream: process.env.STREAM_LOGS === "true",
        streamURL: process.env.STREAM_LOGS_HOST || "localhost:5000",

        save: process.env.SAVE_LOGS === "true",
        path: process.env.LOGS_PATH || "logs",
        level: process.env.DEBUG_LEVEL || "info",
        deleteAfter: parseInt(process.env.DELETE_LOGS_AFTER_X_DAYS, 10) || 14,
        maxSize: process.env.MAX_LOG_SIZE || "100m",

        orm: process.env.ORM_LOGS === "true",
    },

    // Relational DB Settings
    rdb: {
        type: process.env.RDB_TYPE,
        host: process.env.RDB_HOST,
        port: parseInt(process.env.RDB_PORT, 10) || 5432,
        name: process.env.RDB_NAME,
        username: process.env.RDB_USER,
        password: process.env.RDB_PASSWORD,
        migrations: "src/database/migrations",
    },

    // HTTP configuration
    http: {
        host: process.env.HTTP_HOST || "localhost",
        port: parseInt(process.env.HTTP_PORT, 10),
        cors: {
            allowedOrigin: process.env.CORS_ALLOWED_ORIGIN,
            allowedHeaders: process.env.CORS_ALLOWED_HEADERS.split(/[, ]+/),
            allowedMethods: process.env.CORS_ALLOWED_METHODS.split(/[, ]+/),
        },
    },

    // gRPC configuration
    grpc: {
        host: process.env.GRPC_HOST || "localhost",
        port: parseInt(process.env.GRPC_PORT, 10),
        // TLS configuration
        certificate: {
            certPath: process.env.GRPC_CERT_PATH,
            keyPath: process.env.GRPC_KEY_PATH,
        },
    },

    // Kafka configuration
    kafka: {
        brokers: process.env.KAFKA_BROKERS.split(/[, ]+/) || ["localhost:9092"],
        groupId: process.env.KAFKA_GROUP_ID || "ms-orders-management",
    },
});
