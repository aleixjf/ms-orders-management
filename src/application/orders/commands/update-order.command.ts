import {OmitType, PartialType} from "@nestjs/mapped-types";

import {OrderDTO} from "@application/orders/dtos/order.dto";

export class UpdateOrderCommand extends PartialType(
    OmitType(OrderDTO, [
        "id",
        "price", // ? This is a getter computed from the products, so we omit it here
    ] as const)
) {}
