import {IsUUID} from "class-validator";

export class GetOrderRequestDTO {
    @IsUUID()
    id: string;
}
