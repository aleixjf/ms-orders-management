export class ProductDescription {
    private readonly _value: string;

    private constructor(value: string) {
        if (value.length > 500) {
            throw new Error("Product description cannot exceed 500 characters");
        }

        // Store trimmed value to avoid leading/trailing spaces
        this._value = value.trim();
    }

    static create(value: string): ProductDescription {
        return new ProductDescription(value);
    }

    static empty(): ProductDescription {
        return new ProductDescription("");
    }

    get value(): string {
        return this._value;
    }

    equals(other: ProductDescription): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }

    /**
     * Check if the description is empty or contains only whitespace
     */
    get isEmpty(): boolean {
        return this._value.length === 0;
    }

    /**
     * Check if the description contains a specific keyword (case-insensitive)
     */
    contains(keyword: string): boolean {
        return this._value.toLowerCase().includes(keyword.toLowerCase());
    }

    /**
     * Get the length of the description
     */
    get length(): number {
        return this._value.length;
    }

    /**
     * Get a truncated version of the description
     */
    truncate(maxLength: number): string {
        if (this._value.length <= maxLength) {
            return this._value;
        }
        return this._value.substring(0, maxLength - 3) + "...";
    }
}
