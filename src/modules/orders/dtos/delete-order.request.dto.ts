import {IsUUID} from "class-validator";

export class DeleteOrderRequestDTO {
    @IsUUID()
    id: string;
}
