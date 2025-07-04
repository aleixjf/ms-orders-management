import {PickType} from "@nestjs/mapped-types";

import {OrderDTO} from "@application/orders/dtos/order.dto";

export class UpdateOrderStatusCommand extends PickType(OrderDTO, [
    "id",
    "status",
] as const) {}
