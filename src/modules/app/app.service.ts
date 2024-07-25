import {Injectable, Logger} from "@nestjs/common";

@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);

    isHealthy(): boolean {
        // this.debug_interceptors();
        return true;
    }

    debug_interceptors(): void {
        console.debug("Throwing error...");
        /*
        throw new Error("Generic error");
        throw new NotFoundException(
            "NotFound exception error",
            "Manually thrown for debug purposes"
        );
        throw new HttpException("Http not found error", 404);
        throw new AxiosError(
            "Axios not found error",
            "NOT_FOUND",
            undefined,
            undefined,
            {
                config: {
                    headers: new AxiosHeaders(),
                },
                status: 404,
                statusText: "Not Found",
                headers: new AxiosHeaders(),
                data: {
                    error: {
                        code: 5,
                        message: "Manually thrown for debug purposes",
                    },
                },
            }
        );
        throw new RpcException({
            code: grpc.status.NOT_FOUND,
            message: "gRPC not found error",
        });
        */
    }
}
