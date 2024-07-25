import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Inject,
    Logger,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    UseFilters,
    UseInterceptors,
    UsePipes,
} from "@nestjs/common";
import {ClientKafka} from "@nestjs/microservices";

import {map, Observable, tap} from "rxjs";

import {v4} from "uuid";

import {OrderStatus} from "@enums/order-status.enum";

import {CreateOrderRequestDTO} from "@modules/orders/dtos/create-order.request.dto";
import {GetOrdersRequestDTO} from "@modules/orders/dtos/get-orders.request.dto";
import {OrderDTO} from "@modules/orders/dtos/order.dto";
import {UpdateOrderStatusRequestDTO} from "@modules/orders/dtos/update-order-status.request.dto";
import {UpdateOrderRequestDTO} from "@modules/orders/dtos/update-order.request.dto";

import {OrdersService} from "@modules/orders/orders.service";

import {HTTPValidationPipe} from "@pipes/http-validation.pipe";

import {HTTPInterceptor} from "@interceptors/http.interceptor";

import {AxiosExceptionFilter} from "@filters/axios.filter";
import {HTTPExceptionFilter} from "@filters/http.filter";
import {InternalExceptionFilter} from "@filters/internal.filter";
import {RPCExceptionFilter} from "@filters/rpc.filter";

@Controller("orders")
@UsePipes(HTTPValidationPipe)
@UseInterceptors(ClassSerializerInterceptor, HTTPInterceptor)
@UseFilters(
    InternalExceptionFilter,
    RPCExceptionFilter,
    AxiosExceptionFilter,
    HTTPExceptionFilter
)
export class OrdersHTTPController {
    private readonly logger = new Logger(OrdersHTTPController.name);
    constructor(
        private ordersService: OrdersService,
        @Inject("KAFKA_CLIENT") private readonly client: ClientKafka
    ) {}

    @Get(":id")
    getOrder(
        @Param("id", ParseUUIDPipe) id: OrderDTO["id"]
    ): Observable<OrderDTO> {
        return this.ordersService.getOrder(id).pipe(
            map((order) => {
                if (!order)
                    throw new NotFoundException(
                        `Order with ID ${id} not found`
                    );
                return order;
            })
        );
    }

    @Get()
    getOrders(@Body() data?: GetOrdersRequestDTO): Observable<OrderDTO[]> {
        const ids = data?.ids;
        return this.ordersService
            .getOrders(ids)
            .pipe(
                tap((orders) => this.logger.debug("Fetched orders", {orders}))
            );
    }

    @Post()
    createOrder(@Body() data: CreateOrderRequestDTO): Observable<OrderDTO> {
        const order = new OrderDTO({
            id: v4(),
            status: OrderStatus.PENDING,
            ...data,
        });
        return this.ordersService.createOrder(order);
    }

    @Put(":id")
    updateOrder(
        @Param("id", ParseUUIDPipe) id: OrderDTO["id"],
        @Body() data: Omit<UpdateOrderRequestDTO, "id">
    ): Observable<OrderDTO> {
        return this.ordersService.updateOrder(id, data);
    }

    @Patch(":id/status")
    updateOrderStatus(
        @Param("id", ParseUUIDPipe) id: OrderDTO["id"],
        @Body() data: Omit<UpdateOrderStatusRequestDTO, "id">
    ): Observable<OrderDTO> {
        return this.ordersService.updateOrder(id, data);
    }

    @Delete(":id")
    deleteOrder(
        @Param("id", ParseUUIDPipe) id: OrderDTO["id"]
    ): Observable<void> {
        return this.ordersService.deleteOrder(id);
    }

    @Patch(":id/confirm")
    confirmOrder(
        @Param("id", ParseUUIDPipe) id: OrderDTO["id"]
    ): Observable<void> {
        return this.ordersService
            .requestConfirmation(id)
            .pipe(map(() => void 0));
    }

    @Patch(":id/cancel")
    cancelOrder(
        @Param("id", ParseUUIDPipe) id: OrderDTO["id"]
    ): Observable<void> {
        return this.ordersService.cancelOrder(id).pipe(map(() => void 0));
    }

    @Patch(":id/ship")
    shipOrder(
        @Param("id", ParseUUIDPipe) id: OrderDTO["id"]
    ): Observable<void> {
        return this.ordersService.shipOrder(id).pipe(map(() => void 0));
    }

    @Patch(":id/deliver")
    deliverOrder(
        @Param("id", ParseUUIDPipe) id: OrderDTO["id"]
    ): Observable<void> {
        return this.ordersService.deliverOrder(id).pipe(map(() => void 0));
    }
}
