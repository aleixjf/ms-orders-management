import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({async: false})
export class isTimeDuration implements ValidatorConstraintInterface {
    validate(value: any) {
        // return /^([0-9]+[smhdwMy])+$/.test(value);
        return /^(?=.*?\d)(?=.*?[a-zA-Z])[\da-zA-Z]+(ms|s|m|h|d|w|M|y)$/.test(
            value
        );

        /*
    // TODO: Check why it always returns false
    try {
      ms(value as StringValue);
      return true;
    } catch (e) {
      return false;
    }
    */
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must be in the format of <number><unit> where unit is one of ms, s, m, h, d, w, M, y`;
    }
}

export function IsTimeDuration(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: isTimeDuration,
        });
    };
}
