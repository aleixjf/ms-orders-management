import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";
import {DatabaseType} from "typeorm";

@ValidatorConstraint({async: false})
export class isDatabase implements ValidatorConstraintInterface {
    validate(value: any) {
        try {
            value as DatabaseType;
            return true;
        } catch (e) {
            return false;
        }

        /*
    const databases: DatabaseType[] = [
      "mysql",
      "postgres",
      "cockroachdb",
      "sap",
      "mariadb",
      "sqlite",
      "cordova",
      "react-native",
      "nativescript",
      "sqljs",
      "oracle",
      "mssql",
      "mongodb",
      "aurora-mysql",
      "aurora-postgres",
      "expo",
      "better-sqlite3",
      "capacitor",
      "spanner",
    ];
    */

        /*
    const databases: DatabaseType[] =
      `"mysql" | "postgres" | "cockroachdb" | "sap" | "mariadb" | "sqlite" | "cordova" | "react-native" | "nativescript" | "sqljs" | "oracle" | "mssql" | "mongodb" | "aurora-data-api" | "aurora-data-api-pg" | "expo" | "better-sqlite3" | "capacitor"`.split(
        " | "
      ) as DatabaseType[];
    return databases.includes(value);
    */
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must be a valid database type`;
    }
}

export function IsDatabase(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: isDatabase,
        });
    };
}
