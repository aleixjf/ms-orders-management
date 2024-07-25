import {PickType} from "@nestjs/mapped-types";

import {OrderDTO} from "@modules/orders/dtos/order.dto";

export class UpdateOrderStatusRequestDTO extends PickType(OrderDTO, [
    "id",
    "status",
] as const) {}
