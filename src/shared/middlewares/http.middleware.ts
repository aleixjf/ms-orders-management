import {Injectable, Logger, NestMiddleware} from "@nestjs/common";

import {NextFunction, Request, Response} from "express";

@Injectable()
export class HTTPMiddleware implements NestMiddleware {
    private readonly logger = new Logger(HTTPMiddleware.name);
    // constructor(private readonly authService) {}

    use(request: Request, response: Response, next: NextFunction) {
        const {method, url, body, ip} = request;

        this.logger.debug("Intercepted HTTP call", {
            method: `${method} ${url}`,
            // handler: `${context.getClass().name}.${context.getHandler().name}`,
            data: body,
            origin:
                // Retrieve the IP address from the client/request
                request.socket.remoteAddress ||
                request.headers["x-forwarded-for"][0] ||
                request.connection.remoteAddress ||
                request.headers["x-real-ip"][0] ||
                request.headers["x-cluster-client-ip"][0] ||
                request.headers["x-forwarded"][0] ||
                request.headers["forwarded-for"][0] ||
                request.headers.forwarded ||
                request.ip ||
                request.ips[0] ||
                undefined,
            /*
            details: {
                url: `${request.protocol}://${
                    request.headers.host || request.hostname
                }${request.url}`,
                headers: request.headers,
            },
            */
        });

        next();
    }
}
