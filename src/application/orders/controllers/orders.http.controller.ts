import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    Logger,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseFilters,
    UseInterceptors,
    UsePipes,
} from "@nestjs/common";

import {Observable} from "rxjs";

import {OrderDTO} from "@application/orders/dtos/order.dto";

import {OrdersAppService} from "@application/orders/services/orders.application.service";

import {HTTPValidationPipe} from "@pipes/http-validation.pipe";

import {HTTPInterceptor} from "@interceptors/http.interceptor";

import {CreateOrderCommand} from "@application/orders/commands/create-order.command";
import {AxiosExceptionFilter} from "@filters/axios.filter";
import {DomainExceptionFilter} from "@filters/domain.filter";
import {HTTPExceptionFilter} from "@filters/http.filter";
import {InternalExceptionFilter} from "@filters/internal.filter";
import {RPCExceptionFilter} from "@filters/rpc.filter";

@Controller("orders")
@UsePipes(HTTPValidationPipe)
@UseInterceptors(ClassSerializerInterceptor, HTTPInterceptor)
@UseFilters(
    InternalExceptionFilter,
    DomainExceptionFilter,
    RPCExceptionFilter,
    AxiosExceptionFilter,
    HTTPExceptionFilter
)
export class OrdersHTTPController {
    private readonly logger = new Logger(OrdersHTTPController.name);

    constructor(private readonly ordersService: OrdersAppService) {}

    @Get(":id")
    getOrder(@Param("id", ParseUUIDPipe) id: string): Observable<OrderDTO> {
        return this.ordersService.getOrder(id);
    }

    @Get()
    getOrders(): Observable<OrderDTO[]> {
        return this.ordersService.getOrders();
    }

    @Post()
    createOrder(@Body() dto: CreateOrderCommand): Observable<OrderDTO> {
        return this.ordersService.createOrder(dto);
    }

    @Patch(":id/confirm")
    confirmOrder(@Param("id", ParseUUIDPipe) id: string): Observable<void> {
        // ? This method is used to start the order confirmation process (async validation through stock reservation)
        return this.ordersService.reserveOrder(id);
    }

    @Patch(":id/cancel")
    cancelOrder(@Param("id", ParseUUIDPipe) id: string): Observable<void> {
        return this.ordersService.cancelOrder(id);
    }

    @Patch(":id/ship")
    shipOrder(@Param("id", ParseUUIDPipe) id: string): Observable<void> {
        return this.ordersService.shipOrder(id);
    }

    @Patch(":id/deliver")
    deliverOrder(@Param("id", ParseUUIDPipe) id: string): Observable<void> {
        return this.ordersService.deliverOrder(id);
    }
}
