import {Global, Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";

import {Environment} from "@enums/environment.enum";

import configuration from "@infrastructure/configuration/configuration";
import {validate} from "@infrastructure/configuration/validation";

@Global() // ? Make this module global so that the ConfigService can be injected anywhere without needing to import the ConfigModule again.
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: false, // ? The module itself does not need to be global, but the ConfigService exported by the module will be made global by the @Global() decorator.
            cache: true,
            expandVariables: true,
            ignoreEnvFile: process.env.NODE_ENV === Environment.Production,
            envFilePath: [
                `${process.env.ENV_FILE}`,
                `environments/.env.${process.env.CLIENT || "development"}`,
                `.env.${process.env.CLIENT || "development"}`,
                ".env",
            ],
            load: [configuration],
            validate,
        }),
    ],
    providers: [ConfigService],
    exports: [ConfigService],
})
export class ConfigurationModule {}
