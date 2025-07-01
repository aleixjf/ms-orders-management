export class OrderDate {
    private readonly _value: number;

    private constructor(value: number) {
        this._value = value;
        if (this._value <= 0) {
            throw new Error("Order date must be a valid timestamp");
        }
    }

    static fromTimestamp(timestamp: number): OrderDate {
        return new OrderDate(timestamp);
    }

    static now(): OrderDate {
        return new OrderDate(Date.now());
    }

    static fromDate(date: Date): OrderDate {
        return new OrderDate(date.getTime());
    }

    get value(): number {
        return this._value;
    }

    toDate(): Date {
        return new Date(this._value);
    }

    isAfter(other: OrderDate): boolean {
        return this._value > other._value;
    }

    isBefore(other: OrderDate): boolean {
        return this._value < other._value;
    }

    equals(other: OrderDate): boolean {
        return this._value === other._value;
    }

    addDays(days: number): OrderDate {
        const newDate = new Date(this._value);
        newDate.setDate(newDate.getDate() + days);
        return new OrderDate(newDate.getTime());
    }
}
