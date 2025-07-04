import {HttpStatus} from "@nestjs/common";

import {status as gRPCStatus} from "@grpc/grpc-js";

import {Order} from "@domain/orders/entities/order.entity";

import {DomainError} from "@domain/shared/errors/domain.error";

interface OrderAlreadyCancelledErrorProps {
    order: Order;
    action: string;
}

export class OrderAlreadyCancelledError extends DomainError {
    constructor(props: OrderAlreadyCancelledErrorProps) {
        super(OrderAlreadyCancelledError.message(props));
        this.name = this.constructor.name;
    }

    static message({order, action}: OrderAlreadyCancelledErrorProps): string {
        return `Order with id ${order.id.value} cannot be ${action} because it has already been cancelled`;
    }

    httpStatus(): HttpStatus {
        return HttpStatus.BAD_REQUEST;
    }

    rpcStatus(): gRPCStatus {
        return gRPCStatus.INVALID_ARGUMENT;
    }
}
