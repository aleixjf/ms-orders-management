import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({async: false})
export class isUnixDate implements ValidatorConstraintInterface {
    validate(value: any, _args: ValidationArguments) {
        try {
            const timestamp =
                typeof value === "number" ? value : parseInt(value, 10);
            const regex = /^[0-9]+$/;
            return (
                regex.test(value.toString()) &&
                Number.isInteger(timestamp) &&
                timestamp >= 0 &&
                new Date(timestamp * 1000).getTime() > 0
            );
        } catch (error) {
            return false;
        }
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must be a valid Unix timestamp`;
    }
}

export function IsUnixDate(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: isUnixDate,
        });
    };
}
