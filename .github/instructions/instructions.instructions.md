---
applyTo: '**'
---
Coding standards, domain knowledge, and preferences that AI should follow.

# Indications for AI

## General Guidelines

- Answer only in the language of the question or fallback to English if not specified.
- Provide concise, clear, and relevant answers.

## Coding Standards

- Use ES6+ features where appropriate (e.g., arrow functions, destructuring).
- Prefer functional programming paradigms where applicable.
- Use async/await for asynchronous operations.
- Use TypeScript interfaces and types to define data structures.
- Use appropriate error handling mechanisms (try/catch, custom error classes).
- Use logging for debugging and monitoring purposes.
- Use environment variables for configuration settings (e.g., database connections, API keys).
- Use a consistent naming convention for files, classes, and functions (e.g., camelCase for functions and variables, PascalCase for classes).
- Use a linter (e.g., ESLint) to enforce coding standards and catch potential issues.
- Use a formatter (e.g., Prettier) to ensure consistent code formatting.
- Write unit tests for critical components and functions using a testing framework (e.g., Jest).
- Use version control (e.g., Git) for all code changes, with clear commit messages that describe the changes made.
- Use pull requests for code reviews and collaboration, ensuring that all code is reviewed before merging into the main branch.
- Document the codebase using JSDoc or similar tools to generate API documentation.
- Use a consistent directory structure for organizing code files (e.g., separate directories for controllers, services, models, and utilities).
- Use dependency injection where appropriate to improve testability and modularity.
- Use TypeScript enums for fixed sets of values (e.g., order statuses, payment methods).
- Use TypeScript generics for reusable components and functions.
- Use TypeScript namespaces or modules to organize related code together.
- Use TypeScript decorators for metadata and configuration (e.g., for dependency injection, validation).
- Use TypeScript utility types (e.g., Partial, Pick, Omit) to manipulate types and interfaces.
- Use TypeScript type guards to narrow down types in conditional statements.
- Use TypeScript type assertions sparingly and only when necessary.
- Use TypeScript's strict mode to catch potential issues early in development.
- Use TypeScript's module resolution features to manage dependencies and imports effectively.
- Use TypeScript's async iterators and generators for handling asynchronous data streams.
- Use TypeScript's type inference capabilities to reduce boilerplate code.
- Use TypeScript's type aliases to create more readable and maintainable code.
- Use TypeScript's `readonly` modifier for immutable data structures.
- Use TypeScript's `unknown` type for values that can be of any type but require type checking before use.
- Use TypeScript's `never` type for functions that never return (e.g., throw an error or enter an infinite loop).
- Use TypeScript's `as const` assertion to create immutable objects and arrays.
- Use TypeScript's `keyof` operator to create types based on the keys of an object.
- Use TypeScript's `Record` utility type to create objects with specific key-value pairs.
- Use TypeScript's `Partial` utility type to create types with optional properties.
- Use TypeScript's `Pick` and `Omit` utility types to create new types based on existing ones.
- Use TypeScript's `ReturnType` utility type to infer the return type of a function.
- Use TypeScript's `Parameters` utility type to infer the parameter types of a function.
- Use TypeScript's `Awaited` utility type to infer the type of a promise's resolved value.
- Use TypeScript's `ThisType` utility type to define the type of `this` in a function or method.
- Use TypeScript's `NonNullable` utility type to create types that exclude `null` and `undefined`.
- Use TypeScript's `Extract` and `Exclude` utility types to create types that filter out specific values from a union type.
- Use TypeScript's `InstanceType` utility type to get the instance type of a class.
- Use TypeScript's `ConstructorParameters` utility type to infer the parameter types of a class constructor.
- Use TypeScript's `ReturnType` utility type to infer the return type of a function.
- Use TypeScript's `Uppercase` and `Lowercase` utility types to manipulate string literals.
- Use TypeScript's `Capitalize` and `Uncapitalize` utility types to manipulate string literals.
- Use TypeScript's `TemplateLiteralTypes` to create types based on template literals.
- Use TypeScript's `Conditional Types` to create types based on conditions (e.g., `T extends U ? X : Y`).
- Use TypeScript's `Mapped Types` to create new types based on existing ones (e.g., `{ [K in keyof T]: U }`).
- Use TypeScript's `Infer` keyword to create types that can infer values from other types (e.g., `infer U` in conditional types).
- Use TypeScript's `Type Guards` to create functions that narrow down types based on conditions (e.g., `function isString(value: any): value is string { return typeof value === 'string'; }`).
- Use TypeScript's `Type Assertions` to assert a value's type when you are certain of its type (e.g., `const value = someValue as string;`).
- Use TypeScript's `Type Aliases` to create more readable and maintainable types (e.g., `type UserID = string;`).
- Use TypeScript's `Enums` to define a set of named constants (e.g., `enum OrderStatus { Pending, Confirmed, Shipped, Delivered, Cancelled }`).
- Use TypeScript's `Interfaces` to define the shape of objects (e.g., `interface Order { id: string; status: OrderStatus; items: OrderItem[]; }`).
- Use TypeScript's `Classes` to define reusable components with properties and methods (e.g., `class OrderService { createOrder(order: Order): void { ... } }`).
- Use TypeScript's `Modules` to organize code into separate files and namespaces (e.g., `export class OrderService { ... }`).
- Use TypeScript's `Namespaces` to group related code together (e.g., `namespace OrderManagement { export class OrderService { ... } }`).
- Use TypeScript's `Decorators` to add metadata and configuration to classes and methods (e.g., `@Injectable() class OrderService { ... }`).
- Use TypeScript's `Generics` to create reusable components and functions (e.g., `function getItem<T>(items: T[], index: number): T { return items[index]; }`).
- Use TypeScript's `Utility Types` to manipulate types and interfaces (e.g, `type User = Omit<UserProfile, 'password'>;`).
- Use TypeScript's `TypeScript Compiler Options` to configure the TypeScript compiler (e.g., `tsconfig.json`).
- Use TypeScript's `TypeScript Language Features` to take advantage of advanced type system features (e.g., `type inference`, `type narrowing`, `type compatibility`).
- Use TypeScript's `TypeScript Ecosystem` to leverage libraries and tools that enhance TypeScript development (e.g., `TypeORM`, `NestJS`, `Express`).
- Use TypeScript's `TypeScript Community` to stay updated with the latest features and best practices (e.g., `TypeScript GitHub`, `TypeScript Discord`, `TypeScript Stack Overflow`).
- Use TypeScript's `TypeScript Documentation` to learn about the language features and best practices (e.g, `TypeScript Handbook`, `TypeScript Deep Dive`).

## Architectural & Design Principles

- Prioritize Domain-Driven Design (DDD) & Hexagonal Architecture
Design microservices around bounded contexts, with the domain model at the core. Ensure your business logic is separated from infrastructure concerns using the hexagonal approach.

- Embrace Modularity & Single Responsibility
Each microservice should have a single, well-defined responsibility, following the Single Responsibility Principle. Maintain clear boundaries and contracts between services and internal components.

- Leverage Event-Driven Communication
Implement asynchronous, event-driven communication between services using domain events for strong decoupling and enhanced resilience.

- Apply Layered Architecture & Dependency Injection
Structure your code with clear layers (e.g., controllers, application services, domain, infrastructure) and use dependency injection to manage dependencies, promoting testability and flexibility.

- Define Clear Contracts
Use interfaces to establish explicit contracts for internal components and for RESTful APIs or gRPC for external service communication.

- Consider CQRS
Apply Command Query Responsibility Segregation (CQRS) where separating read and write models offers significant performance or scalability benefits.

- Utilize Appropriate Design patterns
Employ established design patterns (e.g., Repository, Service, Factory) to solve common problems and ensure consistent, maintainable solutions.

## Development Practices
- Version Control with Intent
Use Git for all code changes. Write atomic commits with clear, descriptive messages explaining what was changed and why.

- Foster Code Review & Collaboration
Utilize pull requests to facilitate thorough code reviews, ensuring code quality and knowledge sharing before merging into the main branch.

- Maintain Code Quality & Consistency
Write modular, maintainable code that adheres to best practices. Use clear and descriptive names for variables, functions, and classes. Ensure consistent formatting and indentation throughout the codebase.

- Document Complex Logic
Add comments judiciously to explain complex algorithms, business rules, or non-obvious design decisions, but strive for self-documenting code.

- Ensure Robust Testing
Implement a comprehensive testing strategy including unit tests for isolated domain logic and end-to-end tests to validate complete business flows across service integrations.

- Standardize with TypeScript
Use TypeScript for all code, leveraging its type safety and developer tooling benefits.

- Organize Code Effectively
Use a consistent directory structure to organize code files, separating concerns (e.g., controllers, services, models, utilities) for clarity and maintainability.

## Domain Knowledge
- Understand the business domain of e-commerce, including concepts like orders, products, customers, and inventory.
- Be familiar with common e-commerce workflows, such as order creation, payment processing, and inventory management.
- Customers can place orders containing multiple products, and orders go through various states (pending, confirmed, shipped, delivered, and cancelled).
- It is critical to maintain inventory consistency, process payments through an external provider, and notify customers about order changes.
