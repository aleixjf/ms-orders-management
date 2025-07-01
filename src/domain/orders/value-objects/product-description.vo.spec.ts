import {ProductDescription} from "@domain/orders/value-objects/product-description.vo";

describe("ProductDescription", () => {
    describe("create", () => {
        it("should create a valid product description", () => {
            const description = ProductDescription.create(
                "This is a test product description"
            );
            expect(description.value).toBe(
                "This is a test product description"
            );
        });

        it("should trim whitespace from description", () => {
            const description = ProductDescription.create(
                "  Test description  "
            );
            expect(description.value).toBe("Test description");
        });

        it("should allow empty description", () => {
            const description = ProductDescription.create("");
            expect(description.value).toBe("");
            expect(description.isEmpty).toBe(true);
        });

        it("should allow whitespace only description and trim it", () => {
            const description = ProductDescription.create("   ");
            expect(description.value).toBe("");
            expect(description.isEmpty).toBe(true);
        });

        it("should throw error for description exceeding 500 characters", () => {
            const longDescription = "A".repeat(501);
            expect(() => ProductDescription.create(longDescription)).toThrow(
                "Product description cannot exceed 500 characters"
            );
        });

        it("should accept description with exactly 500 characters", () => {
            const exactDescription = "A".repeat(500);
            const description = ProductDescription.create(exactDescription);
            expect(description.value).toBe(exactDescription);
        });
    });

    describe("empty", () => {
        it("should create an empty description", () => {
            const description = ProductDescription.empty();
            expect(description.value).toBe("");
            expect(description.isEmpty).toBe(true);
        });
    });

    describe("equals", () => {
        it("should return true for equal descriptions", () => {
            const desc1 = ProductDescription.create("Test description");
            const desc2 = ProductDescription.create("Test description");
            expect(desc1.equals(desc2)).toBe(true);
        });

        it("should return false for different descriptions", () => {
            const desc1 = ProductDescription.create("Test description");
            const desc2 = ProductDescription.create("Different description");
            expect(desc1.equals(desc2)).toBe(false);
        });

        it("should consider empty descriptions equal", () => {
            const desc1 = ProductDescription.create("");
            const desc2 = ProductDescription.empty();
            expect(desc1.equals(desc2)).toBe(true);
        });
    });

    describe("toString", () => {
        it("should return the string value", () => {
            const description = ProductDescription.create("Test description");
            expect(description.toString()).toBe("Test description");
        });
    });

    describe("isEmpty", () => {
        it("should return true for empty description", () => {
            const description = ProductDescription.create("");
            expect(description.isEmpty).toBe(true);
        });

        it("should return true for whitespace-only description", () => {
            const description = ProductDescription.create("   ");
            expect(description.isEmpty).toBe(true);
        });

        it("should return false for non-empty description", () => {
            const description = ProductDescription.create("Test description");
            expect(description.isEmpty).toBe(false);
        });
    });

    describe("contains", () => {
        it("should return true when description contains keyword", () => {
            const description = ProductDescription.create(
                "This is a test product description"
            );
            expect(description.contains("product")).toBe(true);
        });

        it("should return false when description does not contain keyword", () => {
            const description = ProductDescription.create(
                "This is a test product description"
            );
            expect(description.contains("service")).toBe(false);
        });

        it("should be case-insensitive", () => {
            const description = ProductDescription.create(
                "This is a test PRODUCT description"
            );
            expect(description.contains("product")).toBe(true);
            expect(description.contains("PRODUCT")).toBe(true);
        });

        it("should return false for empty description", () => {
            const description = ProductDescription.empty();
            expect(description.contains("test")).toBe(false);
        });
    });

    describe("length", () => {
        it("should return the correct length", () => {
            const description = ProductDescription.create("Test");
            expect(description.length).toBe(4);
        });

        it("should return length of trimmed value", () => {
            const description = ProductDescription.create("  Test  ");
            expect(description.length).toBe(4);
        });

        it("should return 0 for empty description", () => {
            const description = ProductDescription.empty();
            expect(description.length).toBe(0);
        });
    });

    describe("truncate", () => {
        it("should return full text when length is within limit", () => {
            const description = ProductDescription.create("Short text");
            expect(description.truncate(20)).toBe("Short text");
        });

        it("should truncate long text and add ellipsis", () => {
            const description = ProductDescription.create(
                "This is a very long description"
            );
            expect(description.truncate(10)).toBe("This is...");
        });

        it("should handle edge case where maxLength is less than ellipsis", () => {
            const description = ProductDescription.create("Long text");
            expect(description.truncate(3)).toBe("...");
        });

        it("should return empty string for empty description", () => {
            const description = ProductDescription.empty();
            expect(description.truncate(10)).toBe("");
        });
    });
});
