import {OmitType, PartialType} from "@nestjs/mapped-types";

import {IsNotEmpty, IsString} from "class-validator";

import {OrderDTO} from "@modules/orders/dtos/order.dto";

export class UpdateOrderRequestDTO extends PartialType(
    OmitType(OrderDTO, ["id"] as const)
) {
    @IsString()
    @IsNotEmpty()
    id: string;
}
