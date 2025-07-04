import {applyDecorators, UsePipes} from "@nestjs/common";

import {GrpcValidationPipe} from "@pipes/grpc-validation.pipe";

export function ValidateGrpc(dto: any) {
    return applyDecorators(UsePipes(new GrpcValidationPipe()));
}
