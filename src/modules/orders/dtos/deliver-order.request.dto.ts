import {PickType} from "@nestjs/mapped-types";

import {OrderDTO} from "@modules/orders/dtos/order.dto";

export class DeliverOrderRequestDTO extends PickType(OrderDTO, [
    "id",
] as const) {}
