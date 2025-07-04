import {IsUUID} from "class-validator";

export class GetOrdersCommand {
    @IsUUID(4, {each: true})
    ids?: string[];
}
