import {plainToInstance} from "class-transformer";
import {
    IsBoolean,
    IsEnum,
    IsIn,
    IsNumber,
    IsOptional,
    IsPort,
    IsString,
    IsUrl,
    ValidateIf,
    validateSync,
} from "class-validator";
import {type DatabaseType} from "typeorm";

import {Environment} from "@enums/environment.enum";

import {IsDatabase} from "@validators/database.validator";
import {IsHost} from "@validators/host.validator";
import {IsPath} from "@validators/path.validator";
import {IsRegExp} from "@validators/regex.validator";

export class EnvironmentVariables {
    @IsOptional()
    @ValidateIf((o) => o.NODE_ENV !== "test")
    @IsEnum(Environment)
    NODE_ENV: Environment;

    // Logger configuration
    @IsOptional()
    @IsBoolean()
    STREAM_LOGS: boolean;

    @ValidateIf((o) => o.STREAM_LOGS === "true")
    @IsUrl()
    STREAM_LOGS_URL: string;

    @ValidateIf((o) => o.NODE_ENV !== Environment.Production)
    @IsBoolean()
    SAVE_LOGS: boolean;

    @ValidateIf((o) => o.SAVE_LOGS === "true")
    @IsPath()
    LOGS_PATH: string;

    @IsOptional()
    @IsIn(["error", "warn", "info", "verbose", "debug", "silly"])
    DEBUG_LEVEL: string;

    @ValidateIf((o) => o.SAVE_LOGS === "true")
    @IsNumber()
    DELETE_LOGS_AFTER_X_DAYS: number;

    @ValidateIf((o) => o.SAVE_LOGS === "true")
    @IsString()
    MAX_LOG_SIZE: string;

    // HTTP configuration
    @IsNumber()
    HTTP_PORT: number;

    // CORS configuration
    @IsRegExp()
    CORS_ALLOWED_ORIGIN: RegExp;

    @IsString()
    CORS_ALLOWED_HEADERS: string;

    @IsString()
    CORS_ALLOWED_METHODS: string;

    // Relational DB Settings
    @IsDatabase()
    RDB_TYPE: DatabaseType;
    @IsHost()
    RDB_HOST: string;
    @IsPort()
    RDB_PORT: number | string;
    RDB_NAME: string;
    RDB_USER: string;
    RDB_PASSWORD: string;

    // gRPC configuration
    @IsString()
    GRPC_HOST: string;

    @IsNumber()
    GRPC_PORT: number;

    // gRPC TLS configuration
    /*
    @ValidateIf(
        (o) => o.NODE_ENV === Environment.Production || o.USE_SSL === "true"
    )
    @IsCertificate()
    @Exists()
    GRPC_CERT_PATH: string;

    @ValidateIf(
        (o) => o.NODE_ENV === Environment.Production || o.USE_SSL === "true"
    )
    @IsCertificate()
    @Exists()
    GRPC_KEY_PATH: string;
    */

    // Kafka configuration
    @IsUrl(
        {
            require_tld: false, // ? Kafka URLs can be without TLD
        },
        {each: true}
    )
    KAFKA_BROKERS: string;

    @IsString()
    KAFKA_GROUP_ID: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
        skipNullProperties: false,
        skipUndefinedProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(
            "Invalid env values\n\n" +
                errors
                    .map(
                        (error) =>
                            `${error.property}: ${error.value || "undefined"}\n${Object.values(error.constraints).join("\n")}\n`
                    )
                    .join("\n")
        );
    }
    return validatedConfig;
}
