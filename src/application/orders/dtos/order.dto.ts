import {Expose, Type} from "class-transformer";
import {
    ArrayNotEmpty,
    IsEnum,
    IsNotEmpty,
    IsString,
    IsUUID,
    ValidateNested,
} from "class-validator";

import {OrderStatus} from "@enums/order-status.enum";

import {ProductDTO} from "@application/orders/dtos/product.dto";

import {IsUnixDate} from "@validators/unix-date.validator";

export class OrderDTO {
    @IsUUID(4)
    @IsNotEmpty()
    id: string;

    @IsEnum(OrderStatus)
    status: OrderStatus;

    @IsString()
    @IsNotEmpty()
    customerId: string;

    @IsUnixDate()
    orderDate: number;

    @IsUnixDate()
    deliveryDate: number;

    @ValidateNested({each: true})
    @Type(() => ProductDTO)
    @ArrayNotEmpty()
    products: ProductDTO[];

    @Expose({
        toPlainOnly: true, // ? This is necessary to expose a getter as a property in the DTO through the ClassSerializer Interceptor
    })
    get price() {
        return this.products.reduce((total, product) => {
            return total + product.price * product.quantity;
        }, 0);
    }

    constructor(partial: OrderDTO) {
        Object.assign(this, partial);
    }
}
