import {v4 as uuidv4, validate as validateUuid} from "uuid";

export class CustomerId {
    private readonly _value: string;

    private constructor(value: string) {
        if (!value) {
            throw new Error("Customer ID cannot be empty");
        }

        if (!validateUuid(value)) {
            throw new Error("Customer ID must be a valid UUID");
        }

        this._value = value;
    }

    static generate(): CustomerId {
        return new CustomerId(uuidv4());
    }

    static create(value: string): CustomerId {
        return new CustomerId(value);
    }

    get value(): string {
        return this._value;
    }

    equals(other: CustomerId): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }
}
