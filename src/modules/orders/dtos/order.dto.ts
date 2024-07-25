import {Expose, instanceToPlain, Type} from "class-transformer";
import {
    ArrayNotEmpty,
    IsEnum,
    IsNotEmpty,
    IsString,
    ValidateNested,
} from "class-validator";

import {OrderStatus} from "@enums/order-status.enum";

import {ProductDTO} from "./product.dto";
import {Order} from "@modules/orders/entities/order.entity";
import {OrderMapper} from "@modules/orders/entities/order.mapper";

import {IsUnixDate} from "@validators/unix-date.validator";
import { PartialType } from '@nestjs/mapped-types';

export class OrderDTO {
    @IsString()
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
    private get price() {
        return this.products.reduce((total, product) => {
            const price = parseFloat(product.price || "0");
            return total + price * product.quantity;
        }, 0);
    }

    // ? We must remove the public methods from the DTO for Jest to be able to use them
    // ? This is because of the way Jest serializes the object, and if the methods are public, they will be included in the serialized object.
    constructor(partial: Omit<OrderDTO, 'toEntity' | 'toPlain'>) {
        Object.assign(this, partial);
    }

    toEntity() {
        return new OrderMapper().dtoToEntity(this);
    }

    toPlain() {
        return instanceToPlain(this);
    }

    static fromEntity(entity: OrderDTO | Order): OrderDTO {
        return entity instanceof OrderDTO
            ? entity
            : new OrderMapper().getDTO(entity);
    }
    static fromEntities(entities: (OrderDTO | Order)[]): OrderDTO[] {
        return entities.map((entity) => OrderDTO.fromEntity(entity));
    }
}
