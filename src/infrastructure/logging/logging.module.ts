import {Global, Logger, Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";

import {CustomLogger} from "@infrastructure/logging/custom.logger";
import {ExtendedLogger} from "@infrastructure/logging/extended.logger";

@Global() // ? Make this LoggingModule global if you want logger to be available everywhere
@Module({
    imports: [ConfigModule], // ? Import ConfigModule to make ConfigService available
    providers: [
        {
            inject: [ConfigService],
            provide: Logger, // ? This will make the ExtendedLogger the default logger for NestJS
            useFactory: (configService: ConfigService) =>
                new ExtendedLogger("App", configService, {
                    console: configService.get<"Nest" | "Custom">(
                        "LOG_CONSOLE_MODE",
                        "Nest"
                    ),
                    stackLinesInConsole: configService.get<
                        number | "default" | "none"
                    >("LOG_STACK_LINES", "default"),
                }),
        },
        CustomLogger, // ? Provide CustomLogger as a separate injectable service
    ],
    exports: [Logger, CustomLogger], // ? Export Logger and CustomLogger so they can be injected in other modules
})
export class LoggingModule {}
