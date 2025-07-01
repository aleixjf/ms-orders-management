import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({async: false})
class isRegExp implements ValidatorConstraintInterface {
    validate(value: any) {
        try {
            new RegExp(value);
            return true;
        } catch (e) {
            return false;
        }
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must be a valid regular expression`;
    }
}

export function IsRegExp(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: isRegExp,
        });
    };
}
