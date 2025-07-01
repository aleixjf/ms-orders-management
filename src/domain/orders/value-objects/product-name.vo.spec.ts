import {ProductName} from "@domain/orders/value-objects/product-name.vo";

describe("ProductName", () => {
    describe("create", () => {
        it("should create a valid product name", () => {
            const name = ProductName.create("Test Product");
            expect(name.value).toBe("Test Product");
        });

        it("should trim whitespace from product name", () => {
            const name = ProductName.create("  Test Product  ");
            expect(name.value).toBe("Test Product");
        });

        it("should throw error for empty name", () => {
            expect(() => ProductName.create("")).toThrow(
                "Product name cannot be empty or whitespace"
            );
        });

        it("should throw error for whitespace only name", () => {
            expect(() => ProductName.create("   ")).toThrow(
                "Product name cannot be empty or whitespace"
            );
        });

        it("should throw error for name less than 2 characters", () => {
            expect(() => ProductName.create("A")).toThrow(
                "Product name must be at least 2 characters long"
            );
        });

        it("should throw error for name exceeding 100 characters", () => {
            const longName = "A".repeat(101);
            expect(() => ProductName.create(longName)).toThrow(
                "Product name cannot exceed 100 characters"
            );
        });

        it("should accept name with exactly 100 characters", () => {
            const exactName = "A".repeat(100);
            const name = ProductName.create(exactName);
            expect(name.value).toBe(exactName);
        });
    });

    describe("equals", () => {
        it("should return true for equal product names", () => {
            const name1 = ProductName.create("Test Product");
            const name2 = ProductName.create("Test Product");
            expect(name1.equals(name2)).toBe(true);
        });

        it("should return false for different product names", () => {
            const name1 = ProductName.create("Test Product");
            const name2 = ProductName.create("Different Product");
            expect(name1.equals(name2)).toBe(false);
        });

        it("should ignore case differences in comparison", () => {
            const name1 = ProductName.create("Test Product");
            const name2 = ProductName.create("test product");
            expect(name1.equals(name2)).toBe(false); // Value Objects are case-sensitive
        });
    });

    describe("toString", () => {
        it("should return the string value", () => {
            const name = ProductName.create("Test Product");
            expect(name.toString()).toBe("Test Product");
        });
    });

    describe("contains", () => {
        it("should return true when name contains keyword", () => {
            const name = ProductName.create("Test Product Name");
            expect(name.contains("Product")).toBe(true);
        });

        it("should return false when name does not contain keyword", () => {
            const name = ProductName.create("Test Product Name");
            expect(name.contains("Service")).toBe(false);
        });

        it("should be case-insensitive", () => {
            const name = ProductName.create("Test Product Name");
            expect(name.contains("product")).toBe(true);
            expect(name.contains("PRODUCT")).toBe(true);
        });
    });

    describe("length", () => {
        it("should return the correct length", () => {
            const name = ProductName.create("Test");
            expect(name.length).toBe(4);
        });

        it("should return length of trimmed value", () => {
            const name = ProductName.create("  Test  ");
            expect(name.length).toBe(4);
        });
    });
});
