import {PickType} from "@nestjs/mapped-types";

import {OrderDTO} from "@application/orders/dtos/order.dto";

export class ConfirmOrderCommand extends PickType(OrderDTO, ["id"] as const) {}

export class CancelOrderCommand extends PickType(OrderDTO, ["id"] as const) {}

export class ShipOrderCommand extends PickType(OrderDTO, ["id"] as const) {}

export class DeliverOrderCommand extends PickType(OrderDTO, ["id"] as const) {}
