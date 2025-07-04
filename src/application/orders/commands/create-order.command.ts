import {OmitType} from "@nestjs/mapped-types";

import {OrderDTO} from "@application/orders/dtos/order.dto";

export class CreateOrderCommand extends OmitType(OrderDTO, [
    "id",
    "status",
    "price", // ? This is a getter computed from the products, so we omit it here
] as const) {}
