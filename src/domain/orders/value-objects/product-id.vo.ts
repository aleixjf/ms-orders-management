import {v4 as uuidv4, validate as validateUuid} from "uuid";

export class ProductId {
    private readonly _value: string;

    private constructor(value: string) {
        if (!value) {
            throw new Error("Product ID cannot be empty");
        }

        if (!validateUuid(value)) {
            throw new Error("Product ID must be a valid UUID");
        }

        this._value = value;
    }

    static generate(): ProductId {
        return new ProductId(uuidv4());
    }

    static create(value: string): ProductId {
        return new ProductId(value);
    }

    get value(): string {
        return this._value;
    }

    equals(other: ProductId): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }
}
