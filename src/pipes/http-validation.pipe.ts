import {ValidationPipe} from "@nestjs/common";

import {ValidationError} from "class-validator";

import {ValidationFailedException} from "@filters/exceptions/http/validation-failed.exception";

// ? This pipe will validate the incoming requests
// ? This pipe can also transform the incoming DTOs (plain objects) into class instances
// ? It will validate the incoming request parameters (route param (:id), query param (?param=x), body (defined in the DTO)) as defined with @Decorators in the controllers' methods

export const HTTPValidationPipe: ValidationPipe = new ValidationPipe({
    // whitelist: true, // ? This will remove all the properties that are not in the DTO or with the @IsOptional decorator or with incorrect types
    transform: true, // ? This will transform the incoming DTOs (plain objects) into class instances
    transformOptions: {
        enableImplicitConversion: false, // ? If true, this will transform the incoming request parameters into the expected types, if possible (e.g. "1" -> 1, "true" -> true, "2021-01-01" -> Date, etc.)
    },
    exceptionFactory: (errors: ValidationError[] = []) => {
        // ? This will be the error that is thrown when the validation fails
        console.debug(
            "Validation errors: ",
            errors.map((error) => {
                delete error.target;
                delete error.contexts;
                delete error.children;
                return error;
            })
        );
        throw new ValidationFailedException(errors);
    },
});
