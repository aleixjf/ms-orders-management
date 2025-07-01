import * as fs from "fs";

import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({async: false})
class exists implements ValidatorConstraintInterface {
    validate(value: any) {
        try {
            return fs.existsSync(value);
        } catch (e) {
            return false;
        }
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must exist. Verify that the path is correct and the file exists.`;
    }
}
export function Exists(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: exists,
        });
    };
}
