# ADR-002: Value Objects with Private Constructors

## Context

We need immutability and consistent validation in value objects throughout our domain model. Value objects should be immutable by design and should validate their invariants at creation time to ensure they are always in a valid state.

## Decision

Implement Value Objects with private constructors and static factory methods.

### Implementation Pattern

```typescript
export class Email {
  private constructor(private readonly value: string) {}

  public static create(value: string): Email {
    if (!this.isValid(value)) {
      throw new Error('Invalid email format');
    }
    return new Email(value);
  }

  private static isValid(email: string): boolean {
    // Validation logic
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

## Consequences

### Positive

- ✅ Guaranteed immutability
- ✅ Centralized validation at creation time
- ✅ More expressive API with semantic factory methods
- ✅ Prevention of invalid object creation
- ✅ Clear domain semantics
- ✅ Better type safety

### Negative

- ❌ More verbose syntax than public constructors
- ❌ Slightly higher learning curve for developers
- ❌ More boilerplate code required

## Examples in the Codebase

- `OrderId`: Validates UUID format
- `CustomerId`: Ensures proper customer identification
- `ProductName`: Validates business rules for product names
- `Price`: Ensures positive values and proper currency handling

## Guidelines

1. Always use private constructors for value objects
2. Provide static factory methods with descriptive names
3. Validate all invariants in the factory method
4. Implement `equals()` method for value comparison
5. Make all properties readonly
6. Throw domain-specific exceptions for validation failures
