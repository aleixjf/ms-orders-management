import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from "class-validator";

export class ProductDTO {
    @IsUUID(4)
    id: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber({allowNaN: false, allowInfinity: false})
    @Min(0)
    price: number;

    constructor(partial: ProductDTO) {
        Object.assign(this, partial);
    }
}
