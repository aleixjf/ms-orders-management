import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({async: false})
class isHost implements ValidatorConstraintInterface {
    validate(value: any) {
        try {
            return /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/.test(
                value
            );
        } catch (e) {
            return false;
        }
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must be a valid host name`;
    }
}
export function IsHost(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: isHost,
        });
    };
}
