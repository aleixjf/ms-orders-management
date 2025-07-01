import {HttpStatus} from "@nestjs/common";

import {status as gRPCStatus} from "@grpc/grpc-js";

import {Order} from "@domain/orders/entities/order.entity";

import {DomainError} from "@domain/shared/errors/domain.error";

interface OrderAlreadyShippedErrorProps {
    order: Order;
    action: string;
}

export class OrderAlreadyShippedError extends DomainError {
    constructor(props: OrderAlreadyShippedErrorProps) {
        super(OrderAlreadyShippedError.message(props));
        this.name = this.constructor.name;
    }

    static message({order, action}: OrderAlreadyShippedErrorProps): string {
        return `Order with id ${order.id.value} cannot be ${action} because it has already been shipped`;
    }

    httpStatus(): HttpStatus {
        return HttpStatus.BAD_REQUEST;
    }

    rpcStatus(): gRPCStatus {
        return gRPCStatus.INVALID_ARGUMENT;
    }
}
