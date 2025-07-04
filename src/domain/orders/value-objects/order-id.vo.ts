import {v4 as uuidv4, validate as validateUuid} from "uuid";

export class OrderId {
    private readonly _value: string;

    private constructor(value: string) {
        if (!value) {
            throw new Error("Order ID cannot be empty");
        }

        if (!validateUuid(value)) {
            throw new Error("Order ID must be a valid UUID");
        }

        this._value = value;
    }

    static generate(): OrderId {
        return new OrderId(uuidv4());
    }

    static create(value: string): OrderId {
        return new OrderId(value);
    }

    get value(): string {
        return this._value;
    }

    equals(other: OrderId): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }
}
