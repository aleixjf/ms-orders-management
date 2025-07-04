import {
    ClassSerializerInterceptor,
    Controller,
    Logger,
    UseFilters,
    UseInterceptors,
} from "@nestjs/common";
import {GrpcMethod} from "@nestjs/microservices";

import {HealthService} from "@application/health/services/health.service";

import {gRPCInterceptor} from "@interceptors/grpc.interceptor";

import {AxiosExceptionFilter} from "@filters/axios.filter";
import {DomainExceptionFilter} from "@filters/domain.filter";
import {HTTPExceptionFilter} from "@filters/http.filter";
import {InternalExceptionFilter} from "@filters/internal.filter";
import {RPCExceptionFilter} from "@filters/rpc.filter";

@Controller()
@UseInterceptors(ClassSerializerInterceptor, gRPCInterceptor)
@UseFilters(
    InternalExceptionFilter,
    DomainExceptionFilter,
    RPCExceptionFilter,
    AxiosExceptionFilter,
    HTTPExceptionFilter
)
export class HealthgRPCController {
    private readonly logger = new Logger(HealthgRPCController.name);
    constructor(private readonly healthService: HealthService) {}

    // ? The controller name and the method name are necessary here since the main/parent controller and the method don't have the exact same names (transformed to PascalCase) as defined in the proto file
    @GrpcMethod("AppController", "IsHealthy")
    isHealthy(): boolean {
        return this.healthService.isHealthy();
    }
}
