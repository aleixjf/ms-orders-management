export class ProductName {
    private readonly _value: string;

    private constructor(value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error("Product name cannot be empty or whitespace");
        }

        if (value.trim().length < 2) {
            throw new Error("Product name must be at least 2 characters long");
        }

        if (value.length > 100) {
            throw new Error("Product name cannot exceed 100 characters");
        }

        // Store trimmed value to avoid leading/trailing spaces
        this._value = value.trim();
    }

    static create(value: string): ProductName {
        return new ProductName(value);
    }

    get value(): string {
        return this._value;
    }

    equals(other: ProductName): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }

    /**
     * Check if the product name contains a specific keyword (case-insensitive)
     */
    contains(keyword: string): boolean {
        return this._value.toLowerCase().includes(keyword.toLowerCase());
    }

    /**
     * Get the length of the product name
     */
    get length(): number {
        return this._value.length;
    }
}
