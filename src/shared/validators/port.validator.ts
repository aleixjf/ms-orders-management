import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

interface Options {
    min?: number;
    max?: number;
    blacklist?: number[];
}

@ValidatorConstraint({async: false})
class isPort implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        try {
            const options: Options = args.constraints[0];
            const {min, max, blacklist} = options;
            const port =
                typeof value === "number" ? value : parseInt(value, 10);
            if (isNaN(port) || !isFinite(port)) {
                return false;
            }
            if (blacklist && blacklist.includes(port)) {
                return false;
            }
            return port >= min && port <= max;
        } catch (e) {
            return false;
        }
    }

    defaultMessage(args?: ValidationArguments): string {
        const options: Options = args.constraints[0];
        if (options.blacklist && options.blacklist.includes(args.value)) {
            return args.property + " is blacklisted";
        } else if (args.value < options.min || args.value > options.max) {
            return (
                args.property +
                " must be between " +
                options.min +
                " and " +
                options.max
            );
        }
        return args.property + " is invalid";
    }
}

export function IsPort(
    options: Options = {
        min: 0,
        max: 65535,
        blacklist: [],
    },
    validationOptions?: ValidationOptions
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [options],
            validator: isPort,
        });
    };
}
