export class ProductQuantity {
    private readonly _value: number;

    private constructor(value: number) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new Error("Product quantity must be a positive integer");
        }

        this._value = value;
    }

    static create(value: number): ProductQuantity {
        return new ProductQuantity(value);
    }

    get value(): number {
        return this._value;
    }

    add(quantity: ProductQuantity): ProductQuantity {
        return new ProductQuantity(this._value + quantity._value);
    }

    subtract(quantity: ProductQuantity): ProductQuantity {
        const result = this._value - quantity._value;
        if (result < 0) {
            throw new Error("Cannot subtract more quantity than available");
        }
        return new ProductQuantity(result);
    }

    isGreaterThan(other: ProductQuantity): boolean {
        return this._value > other._value;
    }

    isLessThan(other: ProductQuantity): boolean {
        return this._value < other._value;
    }

    equals(other: ProductQuantity): boolean {
        return this._value === other._value;
    }
}
