import {PickType} from "@nestjs/mapped-types";

import {OrderDTO} from "@application/orders/dtos/order.dto";

export class GetOrderCommand extends PickType(OrderDTO, ["id"] as const) {}
