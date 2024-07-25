import {
    ClassSerializerInterceptor,
    Controller,
    Inject,
    Logger,
    NotFoundException,
    UseFilters,
    UseInterceptors,
} from "@nestjs/common";
import {ClientKafka, GrpcMethod} from "@nestjs/microservices";

import {map, Observable} from "rxjs";

import {Metadata, type ServerUnaryCall} from "@grpc/grpc-js";
import {v4} from "uuid";

import {ValidateGrpc} from "@decorators/grpc-validation.decorator";

import {OrderStatus} from "@enums/order-status.enum";

import {CancelOrderRequestDTO} from "@modules/orders/dtos/cancel-order.request.dto";
import {ConfirmOrderRequestDTO} from "@modules/orders/dtos/confirm-order.request.dto";
import {CreateOrderRequestDTO} from "@modules/orders/dtos/create-order.request.dto";
import {DeleteOrderRequestDTO} from "@modules/orders/dtos/delete-order.request.dto";
import {DeliverOrderRequestDTO} from "@modules/orders/dtos/deliver-order.request.dto";
import {GetOrderRequestDTO} from "@modules/orders/dtos/get-order.request.dto";
import {GetOrdersRequestDTO} from "@modules/orders/dtos/get-orders.request.dto";
import {OrderDTO} from "@modules/orders/dtos/order.dto";
import {ShipOrderRequestDTO} from "@modules/orders/dtos/ship-order.request.dto";
import {UpdateOrderStatusRequestDTO} from "@modules/orders/dtos/update-order-status.request.dto";
import {UpdateOrderRequestDTO} from "@modules/orders/dtos/update-order.request.dto";

import {OrdersService} from "@modules/orders/orders.service";

import {gRPCInterceptor} from "@interceptors/grpc.interceptor";

import {AxiosExceptionFilter} from "@filters/axios.filter";
import {HTTPExceptionFilter} from "@filters/http.filter";
import {InternalExceptionFilter} from "@filters/internal.filter";
import {RPCExceptionFilter} from "@filters/rpc.filter";

@Controller("orders")
@UseInterceptors(ClassSerializerInterceptor, gRPCInterceptor)
@UseFilters(
    InternalExceptionFilter,
    RPCExceptionFilter,
    AxiosExceptionFilter,
    HTTPExceptionFilter
)
export class OrdersgRPCController {
    private readonly logger = new Logger(OrdersgRPCController.name);
    constructor(
        private ordersService: OrdersService,
        @Inject("KAFKA_CLIENT") private readonly client: ClientKafka
    ) {}

    @GrpcMethod("OrdersController", "GetOrder")
    @ValidateGrpc(GetOrderRequestDTO)
    getOrder(
        data: GetOrderRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO> {
        const id = data.id;
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

    @GrpcMethod("OrdersController", "GetOrders")
    getOrders(
        data: GetOrdersRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO[]> {
        const ids = data.ids;
        return this.ordersService.getOrders(ids);
    }

    @GrpcMethod("OrdersController", "CreateOrder")
    @ValidateGrpc(CreateOrderRequestDTO)
    createOrder(
        data: CreateOrderRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO> {
        const order = new OrderDTO({
            id: v4(),
            status: OrderStatus.PENDING,
            ...data,
        });
        return this.ordersService.createOrder(order);
    }

    @GrpcMethod("OrdersController", "UpdateOrder")
    @ValidateGrpc(UpdateOrderRequestDTO)
    updateOrder(
        data: UpdateOrderRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO> {
        return this.ordersService.updateOrder(data.id, data);
    }

    @GrpcMethod("OrdersController", "UpdateOrderStatus")
    @ValidateGrpc(UpdateOrderStatusRequestDTO)
    updateOrderStatus(
        data: UpdateOrderStatusRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<OrderDTO> {
        return this.ordersService.updateOrder(data.id, data);
    }

    @GrpcMethod("OrdersController", "DeleteOrder")
    @ValidateGrpc(DeleteOrderRequestDTO)
    deleteOrder(
        data: DeleteOrderRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<void> {
        const id = data.id;
        return this.ordersService.deleteOrder(id);
    }

    @GrpcMethod("OrdersController", "ConfirmOrder")
    @ValidateGrpc(ConfirmOrderRequestDTO)
    confirmOrder(
        data: ConfirmOrderRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<void> {
        const id = data.id;
        return this.ordersService.requestConfirmation(id);
    }

    @GrpcMethod("OrdersController", "CancelOrder")
    @ValidateGrpc(CancelOrderRequestDTO)
    cancelOrder(
        data: CancelOrderRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<void> {
        const id = data.id;
        return this.ordersService.cancelOrder(id).pipe(map(() => void 0));
    }

    @GrpcMethod("OrdersController", "ShipOrder")
    @ValidateGrpc(ConfirmOrderRequestDTO)
    shipOrder(
        data: ShipOrderRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<void> {
        const id = data.id;
        return this.ordersService.shipOrder(id).pipe(map(() => void 0));
    }

    @GrpcMethod("OrdersController", "DeliverOrder")
    @ValidateGrpc(ConfirmOrderRequestDTO)
    deliverOrder(
        data: DeliverOrderRequestDTO,
        metadata: Metadata,
        call: ServerUnaryCall<any, any>
    ): Observable<void> {
        const id = data.id;
        return this.ordersService.deliverOrder(id).pipe(map(() => void 0));
    }
}
