import {OmitType} from "@nestjs/mapped-types";

import {OrderDTO} from "@modules/orders/dtos/order.dto";
import { ArrayNotEmpty, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ProductDTO } from "@modules/orders/dtos/product.dto";

export class CreateOrderRequestDTO extends OmitType(OrderDTO, [
    "id",
    "status",
    "toEntity",
    "toPlain",
] as const) {}
