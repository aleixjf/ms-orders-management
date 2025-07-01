import {HttpStatus} from "@nestjs/common";

import {status as gRPCStatus} from "@grpc/grpc-js";

import {OrderStatus} from "@enums/order-status.enum";

import {Order} from "@domain/orders/entities/order.entity";

import {DomainError} from "@domain/shared/errors/domain.error";

interface InvalidStatusTransitionErrorProps {
    order: Order;
    action: OrderStatus;
}

export class InvalidStatusTransitionError extends DomainError {
    constructor(props: InvalidStatusTransitionErrorProps) {
        super(InvalidStatusTransitionError.message(props));
        this.name = this.constructor.name;
    }

    static message({order, action}: InvalidStatusTransitionErrorProps): string {
        return `Order with id ${order.id.value} cannot be ${action} because it is in ${order.status} status`;
    }

    httpStatus(): HttpStatus {
        return HttpStatus.BAD_REQUEST;
    }

    rpcStatus(): gRPCStatus {
        return gRPCStatus.INVALID_ARGUMENT;
    }
}
