import {
    ClassSerializerInterceptor,
    Controller,
    Inject,
    Logger,
    UseFilters,
    UseInterceptors,
} from "@nestjs/common";
import {ClientKafka, GrpcMethod} from "@nestjs/microservices";

import {map, Observable} from "rxjs";

import {Metadata, type ServerUnaryCall} from "@grpc/grpc-js";

import {ValidateGrpc} from "@decorators/grpc-validation.decorator";

import {OrderDTO} from "@application/orders/dtos/order.dto";

import {OrdersAppService} from "@application/orders/services/orders.application.service";

import {gRPCInterceptor} from "@interceptors/grpc.interceptor";

import {
    CancelOrderCommand,
    ConfirmOrderCommand,
    DeliverOrderCommand,
    ShipOrderCommand,
} from "@application/orders/commands";
import {CreateOrderCommand} from "@application/orders/commands/create-order.command";
import {GetOrderCommand} from "@application/orders/commands/get-order.command";
import {GetOrdersCommand} from "@application/orders/commands/get-orders.command";
import {AxiosExceptionFilter} from "@filters/axios.filter";
import {DomainExceptionFilter} from "@filters/domain.filter";
import {HTTPExceptionFilter} from "@filters/http.filter";
import {InternalExceptionFilter} from "@filters/internal.filter";
import {RPCExceptionFilter} from "@filters/rpc.filter";

@Controller("orders")
@UseInterceptors(ClassSerializerInterceptor, gRPCInterceptor)
@UseFilters(
    InternalExceptionFilter,
    DomainExceptionFilter,
    RPCExceptionFilter,
    AxiosExceptionFilter,
    HTTPExceptionFilter
)
export class OrdersgRPCController {
    private readonly logger = new Logger(OrdersgRPCController.name);
    constructor(
        private ordersService: OrdersAppService,
        @Inject("KAFKA_CLIENT") private readonly client: ClientKafka
    ) {}

    @GrpcMethod("OrdersController", "GetOrder")
    @ValidateGrpc(GetOrderCommand)
    getOrder(
        data: GetOrderCommand,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO> {
        const id = data.id;
        return this.ordersService.getOrder(id);
    }

    @GrpcMethod("OrdersController", "GetOrders")
    getOrders(
        data: GetOrdersCommand,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO[]> {
        const ids = data.ids;
        return this.ordersService.getOrders(ids);
    }

    @GrpcMethod("OrdersController", "CreateOrder")
    @ValidateGrpc(CreateOrderCommand)
    createOrder(
        data: CreateOrderCommand,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO> {
        return this.ordersService.createOrder(data);
    }

    /*
    @GrpcMethod("OrdersController", "UpdateOrder")
    @ValidateGrpc(UpdateOrderCommand)
    updateOrder(
        data: UpdateOrderCommand,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO> {
        return this.ordersService.updateOrder(data.id, data);
    }

    @GrpcMethod("OrdersController", "UpdateOrderStatus")
    @ValidateGrpc(UpdateOrderStatusCommand)
    updateOrderStatus(
        data: UpdateOrderStatusCommand,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO> {
        return this.ordersService.updateOrder(data.id, data);
    }

    @GrpcMethod("OrdersController", "DeleteOrder")
    @ValidateGrpc(DeleteOrderCommand)
    deleteOrder(
        data: DeleteOrderCommand,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<void> {
        const id = data.id;
        return this.ordersService.deleteOrder(id);
    }
    */

    @GrpcMethod("OrdersController", "ConfirmOrder")
    @ValidateGrpc(ConfirmOrderCommand)
    confirmOrder(
        data: ConfirmOrderCommand,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<void> {
        const id = data.id;
        // ? This method is used to start the order confirmation process (async validation through stock reservation)
        return this.ordersService.reserveOrder(id);
    }

    @GrpcMethod("OrdersController", "CancelOrder")
    @ValidateGrpc(CancelOrderCommand)
    cancelOrder(
        data: CancelOrderCommand,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<void> {
        const id = data.id;
        return this.ordersService.cancelOrder(id).pipe(map(() => void 0));
    }

    @GrpcMethod("OrdersController", "ShipOrder")
    @ValidateGrpc(ConfirmOrderCommand)
    shipOrder(
        data: ShipOrderCommand,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<void> {
        const id = data.id;
        return this.ordersService.shipOrder(id).pipe(map(() => void 0));
    }

    @GrpcMethod("OrdersController", "DeliverOrder")
    @ValidateGrpc(ConfirmOrderCommand)
    deliverOrder(
        data: DeliverOrderCommand,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<void> {
        const id = data.id;
        return this.ordersService.deliverOrder(id).pipe(map(() => void 0));
    }
}
