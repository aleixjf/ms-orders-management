import {HttpModule} from "@nestjs/axios";
import {Global, MiddlewareConsumer, Module, NestModule} from "@nestjs/common";
import {APP_GUARD} from "@nestjs/core";
import {ThrottlerGuard, ThrottlerModule} from "@nestjs/throttler";

import {HealthModule} from "@application/health/health.module";
import {OrdersModule} from "@application/orders/orders.module";
import {ConfigurationModule} from "@infrastructure/configuration/configuration.module";
import {LoggingModule} from "@infrastructure/logging/logging.module";
import {MessagingModule} from "@infrastructure/messaging/messaging.module";
import {DatabaseModule} from "@infrastructure/persistence/database.module";

import {HTTPMiddleware} from "@middlewares/http.middleware";

// import {WinstonModule} from "nest-winston";

@Global()
@Module({
    imports: [
        ConfigurationModule,
        LoggingModule,
        DatabaseModule,
        MessagingModule.forRoot(),
        HttpModule,
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    ttl: 60,
                    limit: 10,
                },
            ],
        }),
        HealthModule,
        OrdersModule,
    ],
    providers: [
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
    configure(consumer: MiddlewareConsumer): void {
        // ? Apply the HTTP middleware to all the routes
        consumer.apply(HTTPMiddleware).forRoutes("*");
    }
}
