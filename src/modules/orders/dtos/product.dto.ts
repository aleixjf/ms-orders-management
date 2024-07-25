import {IsInt, IsOptional, IsString, IsUUID} from "class-validator";

import {ProductMapper} from "@modules/orders/entities/product.mapper";

export class ProductDTO {
    @IsUUID()
    id: string;

    @IsInt()
    quantity: number;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    price?: string;

    constructor(partial: Omit<ProductDTO, "toEntity">) {
        Object.assign(this, partial);
    }

    toEntity() {
        return new ProductMapper().dtoToEntity(this);
    }
}
