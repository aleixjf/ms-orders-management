import {Injectable, LoggerService} from "@nestjs/common";

/**
 * Custom logger implementation that can be used as a NestJS LoggerService
 * This is a basic implementation that can be extended based on your needs
 */
@Injectable()
export class CustomLogger implements LoggerService {
    /**
     * Write a 'log' level log.
     */
    log(message: unknown, ...optionalParams: unknown[]): void {
        // Implement your custom log logic here
        console.log(`[LOG] ${message}`, ...optionalParams);
    }

    /**
     * Write an 'error' level log.
     */
    error(message: unknown, ...optionalParams: unknown[]): void {
        // Implement your custom error logic here
        console.error(`[ERROR] ${message}`, ...optionalParams);
    }

    /**
     * Write a 'warn' level log.
     */
    warn(message: unknown, ...optionalParams: unknown[]): void {
        // Implement your custom warn logic here
        console.warn(`[WARN] ${message}`, ...optionalParams);
    }

    /**
     * Write a 'debug' level log.
     */
    debug?(message: unknown, ...optionalParams: unknown[]): void {
        // Implement your custom debug logic here
        console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }

    /**
     * Write a 'verbose' level log.
     */
    verbose?(message: unknown, ...optionalParams: unknown[]): void {
        // Implement your custom verbose logic here
        console.log(`[VERBOSE] ${message}`, ...optionalParams);
    }
}
