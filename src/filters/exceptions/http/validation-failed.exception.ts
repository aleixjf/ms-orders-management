import {BadRequestException} from "@nestjs/common";

import {ValidationError} from "class-validator";

export class ValidationFailedException extends BadRequestException {
    constructor(errors: ValidationError[]) {
        super("Validation failed", {cause: errors});
        this.cause = errors.map((error) => ({
            // ? Remove validation target from error
            property: error.property,
            value: error.value ?? "undefined",
            constraints: Object.values(error.constraints),
        }));
    }

    override cause: {property: string; value: string; constraints: string[]}[] =
        [];
}
