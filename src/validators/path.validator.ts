import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({async: false})
class isPath implements ValidatorConstraintInterface {
    validate(value: any) {
        try {
            // Regex to test if the path is valid absoulte or relative path in the linux system
            return /^(\/([a-zA-Z0-9-_+]+\/)*|\.\/)?([a-zA-Z0-9]+)$/.test(value);
        } catch (e) {
            return false;
        }
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must be a valid path`;
    }
}
export function IsPath(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: isPath,
        });
    };
}
