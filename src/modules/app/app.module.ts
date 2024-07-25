import {HttpModule} from "@nestjs/axios";
import {Global, MiddlewareConsumer, Module, NestModule} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {APP_GUARD} from "@nestjs/core";
import {ThrottlerGuard, ThrottlerModule} from "@nestjs/throttler";
import {TypeOrmModule} from "@nestjs/typeorm";

import {DatabaseType} from "typeorm";

import configuration from "@config/configuration";
import {validate} from "@config/validation";

import {OrdersModule} from "@modules/orders/orders.module";

import {Environment} from "@enums/environment.enum";

import {AppService} from "@modules/app/app.service";

import {AppgRPCController} from "@modules/app/controllers/app.grpc.controller";
import {AppHttpController} from "@modules/app/controllers/app.http.controller";

import {HTTPMiddleware} from "@middlewares/http.middleware";

// import {WinstonModule} from "nest-winston";

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            expandVariables: true,
            ignoreEnvFile: process.env.NODE_ENV === Environment.Production,
            envFilePath: [
                `${process.env.ENV_FILE}`,
                `src/config/environments/.env.${process.env.CLIENT || "development"}`,
                `.env.${process.env.CLIENT || "development"}`,
                ".env",
            ],
            load: [configuration],
            validate,
        }),
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    ttl: 60,
                    limit: 10,
                },
            ],
        }),
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
        HttpModule,
        OrdersModule,
    ],
    controllers: [AppHttpController, AppgRPCController],
    providers: [
        // Services
        AppService,
        // Guards
        // TODO: Check that the ThrottlerGuard is working as expected in this hybrid application + extend it for non-HTTP protocols (gRPC, GraphQL, etc.)
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        // Pipes
        // ! Global pipes can't be used for gateways or in hybrid applications (microservices included)
        // ? Therefore, they don't need to be added to the providers array, they will work as expected when added to a controller or method with the @UsePipes() decorator.
        /*
        {
            provide: APP_PIPE,
            useValue: HTTPValidationPipe,
        },
        */
        // Interceptors
        // ! Global interceptors can't be used for gateways or in hybrid applications (microservices included)
        // ? Therefore, they don't need to be added to the providers array, they will work as expected when added to a controller or method with the @UseInterceptors() decorator.
        // ! Global interceptors won't work properly with lazy-loaded modules
        /*
        {
            // ? This interceptor will transfrom the outgoing DTOs (class instances) into plain objects
            // ? This allows us to add the @Exclude({ toPlainOnly: true }) decorator to the properties we want to exclude from the response
            // ? This also allows us to use the @Expose({ groups: [Role.Admin] }) decorator to include properties only for specific roles
            provide: APP_INTERCEPTOR,
            useClass: ClassSerializerInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: gRPCInterceptor,
        },
        */
        // Exception Filters
        /*
        // ! Global filters can't be used for gateways or in hybrid applications (microservices included)
        // ? Therefore, they don't need to be added to the providers array, they will work as expected when added to a controller or method with the @UseFilters() decorator.
        {
            provide: APP_FILTER,
            useClass: HTTPExceptionFilter,
        },
        {
            provide: APP_FILTER,
            useClass: AxiosExceptionFilter,
        },
        {
            provide: APP_FILTER,
            useClass: RPCExceptionFilter,
        },
        {
            provide: APP_FILTER,
            useClass: InternalExceptionFilter,
        },
        */
    ],
    exports: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): any {
        // ? Apply the HTTP middleware to all the routes
        consumer.apply(HTTPMiddleware).forRoutes("*");
    }
}
