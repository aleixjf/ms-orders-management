import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    Logger,
    UseFilters,
    UseInterceptors,
    UsePipes,
} from "@nestjs/common";

import {AppService} from "@modules/app/app.service";

import {HTTPValidationPipe} from "@pipes/http-validation.pipe";

import {HTTPInterceptor} from "@interceptors/http.interceptor";

import {AxiosExceptionFilter} from "@filters/axios.filter";
import {HTTPExceptionFilter} from "@filters/http.filter";
import {InternalExceptionFilter} from "@filters/internal.filter";
import {RPCExceptionFilter} from "@filters/rpc.filter";

@Controller()
@UsePipes(HTTPValidationPipe)
@UseInterceptors(ClassSerializerInterceptor, HTTPInterceptor)
@UseFilters(
    InternalExceptionFilter,
    RPCExceptionFilter,
    AxiosExceptionFilter,
    HTTPExceptionFilter
)
export class AppHttpController {
    private readonly logger = new Logger(AppHttpController.name);
    constructor(private readonly appService: AppService) {}

    @Get()
    isHealthy(): boolean {
        return this.appService.isHealthy();
    }
}
