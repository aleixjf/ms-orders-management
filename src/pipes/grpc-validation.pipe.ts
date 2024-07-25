import {ArgumentMetadata, Injectable, PipeTransform} from "@nestjs/common";

import {Metadata} from "@grpc/grpc-js";
import {plainToInstance} from "class-transformer";
import {validate} from "class-validator";

import {ValidationFailedException} from "@filters/exceptions/http/validation-failed.exception";

@Injectable()
export class GrpcValidationPipe implements PipeTransform {
    async transform(value: any, {metatype}: ArgumentMetadata) {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const object = plainToInstance(metatype, value);
        const errors = await validate(object);
        if (errors.length > 0) throw new ValidationFailedException(errors);
        return object;
    }

    private toValidate(metatype: Function): boolean {
        const types: Function[] = [
            String,
            Boolean,
            Number,
            Array,
            Object,
            Metadata,
        ];
        return !types.includes(metatype);
    }
}
