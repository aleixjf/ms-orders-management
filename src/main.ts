import * as fs from "fs";

import {HttpModule, HttpService} from "@nestjs/axios";
import {ConfigService} from "@nestjs/config";
import {NestFactory} from "@nestjs/core";
import {MicroserviceOptions, Transport} from "@nestjs/microservices";

import {KeyCertPair, ServerCredentials} from "@grpc/grpc-js";
import {ReflectionService} from "@grpc/reflection";
import compression from "compression";
import helmet from "helmet";

import {ExtendedLogger} from "@config/logger/extended";

import {AppModule} from "@modules/app/app.module";

import {AxiosInterceptor} from "@interceptors/axios.interceptor";

async function bootstrap() {
    // console.debug("Process ENV", process.env);
    const app = await NestFactory.create(AppModule, {
        // ? We are using the ExtendedLogger to also preserve NestJS functionality (including the original console logger, preserving context when passing arguments to Logger methods, etc.)
        logger: new ExtendedLogger(undefined, {
            console: "Nest",
            stackLinesInConsole: 2,
        }),
    });
    const configuration = app.get(ConfigService);

    // Check if certificates are provided
    let certificates: {
        root: Buffer | null; // CA Client certificate (PEM format) (optional)
        pairs: KeyCertPair[]; // Server certificates (PEM format) (required) (includes the private key and the certificate chain (aka as the public key))
    };

    if (
        // configuration.get("environment") === "production" ||
        configuration.get("useSSL")
    ) {
        try {
            certificates = {
                root: fs.readFileSync(configuration.get("certificates.root")),
                pairs: [
                    {
                        cert_chain: fs.readFileSync(
                            configuration.get("grpc.certificate.certPath")
                        ),
                        private_key: fs.readFileSync(
                            configuration.get("grpc.certificate.keyPath")
                        ),
                    },
                ],
            };
        } catch (e) {
            throw new Error(
                "There was an error when attempting to read the gRPC certificate or key files in the specified path."
            );
        }
    } else {
        certificates = {
            root: null,
            pairs: [],
        };
    }

    // ? Helmet is a collection of 14 smaller middleware functions that set HTTP response headers.
    app.use(helmet());
    // ? Cross-Origin Resource Sharing (CORS) is a mechanism that uses additional HTTP headers to tell browsers to give a web application running at one origin, access to selected resources from a different origin.
    app.enableCors({
        origin: configuration.get("http.cors.allowedOrigin"),
        allowedHeaders: configuration.get("http.cors.allowedHeaders"),
        methods: configuration.get("http.cors.allowedMethods"),
    });
    // ? Cross-Site Request Forgery (CSRF) is an attack that forces an end user to execute unwanted actions on a web application in which they're currently authenticated.
    // TODO: Use CSRF protection from a package which isn't csurf (https://www.npmjs.com/package/csurf), since it has been deprecated.
    // app.use();
    // ? Compression middleware compresses your responses to decrease the size of the response body that is sent to the client.
    app.use(compression());

    // ? This allows us to intercept HTTP requests made from this application using the HttpService
    // ? This is different from the HTTPInterceptor or HTTPMiddleware, which intercepts HTTP requests made to this application
    app.select(HttpModule)
        .get(HttpService)
        .axiosRef.interceptors.request.use(
            AxiosInterceptor.request.success,
            AxiosInterceptor.request.error,
            AxiosInterceptor.request.configuration
        );
    app.select(HttpModule)
        .get(HttpService)
        .axiosRef.interceptors.response.use(
            AxiosInterceptor.response.success,
            AxiosInterceptor.response.error
        );

    /*
    // ! Global interceptors can't be used for gateways or in hybrid applications (microservices included)
    // To use them, we'll have to add them to each controller with the @UseInterceptors() decorator.
    app.useGlobalInterceptors(new HTTPInterceptor(), new gRPCInterceptor());
    */

    /*
    // ! Global filters can't be used for gateways or in hybrid applications (microservices included)
    // To use them, we'll have to add them to each controller with the @UseFilters() decorator.
    app.useGlobalFilters(
        new HTTPExceptionFilter(),
        new AxiosExceptionFilter(),
        new RPCExceptionFilter()
    );
    */

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: "ms_orders_management", // This should match the package name in the .proto file
            protoPath: "src/app.proto",
            url: `${configuration.get("grpc.host")}:${configuration.get(
                "grpc.port"
            )}`,
            // If we are in a production environment, we need to use secure credentials
            // Otherwise, we can use insecure credentials
            credentials:
                // configuration.get("environment") === Environment.Production ||
                configuration.get("useSSL")
                    ? ServerCredentials.createSsl(
                          certificates.root,
                          certificates.pairs
                      )
                    : ServerCredentials.createInsecure(),
            onLoadPackageDefinition: (pkg, server) =>
                new ReflectionService(pkg, server).addToServer(server),
        },
    });

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.KAFKA,
        options: {
            client: {
                brokers: [configuration.get<string>("kafka.broker")],
            },
            consumer: {
                groupId: configuration.get<string>("kafka.groupId"),
                retry: {
                    retries: 5,
                    initialRetryTime: 300,
                    maxRetryTime: 1000,
                    factor: 2,
                    multiplier: 2,
                    restartOnFailure: async (err) => {
                        console.error(err);
                        // TODO: Notify the team about the error and the Kafka consumer restart
                        return true; // Restart (or not) the consumer
                    },
                },
                allowAutoTopicCreation: true,
                sessionTimeout: 30000,
            },
        },
    });

    // ! Microservices do not support global prefixes
    // app.setGlobalPrefix("")

    await app.startAllMicroservices();
    await app.listen(configuration.get<number>("http.port"));
}
bootstrap();

/*
process.on("uncaughtException", (err) => {
    console.error(err && err.stack ? err.stack : err);
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});
process.on("uncaughtExceptionMonitor", (err) => {
    console.error(err && err.stack ? err.stack : err);
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});
process.on("unhandledRejection", (err) => {
    console.error(err);
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});
*/
