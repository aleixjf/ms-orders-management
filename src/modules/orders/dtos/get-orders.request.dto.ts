import {IsOptional, IsUUID} from "class-validator";

export class GetOrdersRequestDTO {
    @IsOptional()
    @IsUUID(undefined, {each: true})
    ids?: string[];
}
