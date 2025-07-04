import {Module} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";

import {DatabaseType} from "typeorm";

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            // @ts-expect-error - type ('DatabaseType') can't be assigned to type ('specific-db-type')
            useFactory: async (configService: ConfigService) => ({
                // ? Connection settings
                type: configService.get<DatabaseType>("rdb.type"),
                host: configService.get("rdb.host"),
                port: configService.get("rdb.port"),
                username: configService.get("rdb.username"),
                password: configService.get("rdb.password"),
                database: configService.get("rdb.name"),

                // ? Connection options
                //keepConnectionAlive: true,
                logging: configService.get<boolean>("logger.orm"),
                // ssl: configService.get<boolean>("production")
                //     ? {
                //           rejectUnauthorized: false,
                //       }
                //     : false,
                retryAttempts: configService.get<boolean>("production")
                    ? 10
                    : 0,
                retryDelay: 1000,

                // ? Database schema, migrations & synchronization
                // cli: { migrationsDir: configService.get("rdb.migrations") },
                // migrations: [`dist/${configService.get("rdb.migrations")}/**/*{.ts,.js}`],
                // migrationsRun: !configService.get<boolean>("production"), // ? This will run the migrations automatically when the application starts
                // synchronize: !configService.get<boolean>("production"), // ! WARNING: This option should never be enabled on a production environment, since it can lead to data loss (it will modify the database schema as per the entities)
                synchronize: true,
                autoLoadEntities: true,
                // namingStrategy: new CustomNamingStrategy(), // ? This will use the custom naming strategy for the database schema
            }),
        }),
    ],
})
export class DatabaseModule {}
