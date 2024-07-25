import {PickType} from "@nestjs/mapped-types";

import {OrderDTO} from "@modules/orders/dtos/order.dto";

export class ShipOrderRequestDTO extends PickType(OrderDTO, ["id"] as const) {}
