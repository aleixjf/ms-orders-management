import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({async: false})
class isCertificate implements ValidatorConstraintInterface {
    validate(value: any) {
        try {
            // Regex to test if the path is valid absoulte or relative path in the linux system and contains a certificate file (with valid extensions)
            return /^(?:\/|(?:\.{1,2}\/)?)(?:[a-zA-Z0-9-_+]+\/)*[a-zA-Z0-9]+(?:\.(pem|crt|cer|key|p12|pfx))$/.test(
                value
            );
        } catch (e) {
            return false;
        }
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must exist. Verify that the path is correct and the file certificate exists.`;
    }
}
export function IsCertificate(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: isCertificate,
        });
    };
}
