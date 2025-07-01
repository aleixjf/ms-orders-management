import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    Logger,
    UseFilters,
    UseInterceptors,
    UsePipes,
} from "@nestjs/common";

import {HealthService} from "@application/health/services/health.service";

import {HTTPValidationPipe} from "@pipes/http-validation.pipe";

import {HTTPInterceptor} from "@interceptors/http.interceptor";

import {AxiosExceptionFilter} from "@filters/axios.filter";
import {DomainExceptionFilter} from "@filters/domain.filter";
import {HTTPExceptionFilter} from "@filters/http.filter";
import {InternalExceptionFilter} from "@filters/internal.filter";
import {RPCExceptionFilter} from "@filters/rpc.filter";

@Controller()
@UsePipes(HTTPValidationPipe)
@UseInterceptors(ClassSerializerInterceptor, HTTPInterceptor)
@UseFilters(
    InternalExceptionFilter,
    DomainExceptionFilter,
    RPCExceptionFilter,
    AxiosExceptionFilter,
    HTTPExceptionFilter
)
export class HealthHttpController {
    private readonly logger = new Logger(HealthHttpController.name);
    constructor(private readonly healthService: HealthService) {}

    @Get()
    isHealthy(): boolean {
        return this.healthService.isHealthy();
    }
}
