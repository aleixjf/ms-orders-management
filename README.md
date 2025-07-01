# Order Management System - Technical Exercise Implementation

This project implements a complete **Order Management microservice** as part of a technical exercise, demonstrating a **Domain-Driven Design (DDD)** architecture with **Hexagonal Architecture** patterns for an e-commerce company migrating from monolith to microservices.

The implementation showcases both **legacy layered architecture** and **modern DDD architecture** working in parallel, featuring immutable Value Objects, behavior-rich Aggregates, automatic domain events, and complete infrastructure decoupling through ports and adapters.

## Table of Contents

- [Business Context](#business-context)
- [Installation and Execution](#installation-and-execution)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Design Decisions and Trade-offs](#design-decisions-and-trade-offs)
- [Future Improvements](#future-improvements)
- [Additional Documentation](#additional-documentation)

## Business Context

An e-commerce company with the following characteristics:

- **Physical Products**: Limited inventory with stock management
- **Order Lifecycle**: Pending → Confirmed → Shipped → Delivered
- **Inventory Consistency**: Critical stock reservation and compensation
- **External Payments**: Integration with external payment providers
- **Customer Notifications**: Event-driven order status updates

### Business Features

- **Order states**: Pending, Confirmed, Shipped, Delivered, Cancelled
- **State transition validation** with business rules encapsulated in the domain
- **Automatic total calculation** through domain methods
- **Compensation logic** for stock and cancellations through events
- **Domain events** for decoupled communication and event-driven architecture
- **Immutable Value Objects** with construction validation

### Technical Implementation

- **Framework**: NestJS with TypeScript
- **Persistence**: TypeORM with PostgreSQL
- **Messaging**: Kafka (simulated in tests)
- **Validation & serialization**: class-validator and class-transformer with well-defined DTOs and entities
  - **Value Objects** with private constructors and factory methods (which include additional validation) for immutability
- **Testing**: Jest for unit and complete e2e tests

### Key Features

- **Aggregate Roots** with encapsulated business logic and automatic domain events
- **Ports and Adapters** for complete infrastructure decoupling
- **Event Publisher** completely decoupled for domain event publishing to Kafka, RabbitMQ, or other messaging systems

## Architecture and Design

More details in [`docs/architecture.md`](docs/architecture.md).

### Implemented DDD Architecture

- **Domain Layer**: Aggregate Roots, Value Objects, Domain Events, Repository Interfaces
- **Application Layer**: Application Services, DTOs, Commands and Use Cases
- **Infrastructure Layer**: Repository Implementations, Event Publishers, Kafka Adapters
- **Presentation Layer**: HTTP Controllers, REST API endpoints

### Applied Patterns and Principles

- **Hexagonal Architecture**: Ports and adapters for infrastructure decoupling
- **DDD Tactical Patterns**: Aggregates, Value Objects, Domain Events, Repository Pattern
- **Event-Driven Architecture**: Domain events for asynchronous communication
- **CQRS Ready**: Clear separation between commands and queries
- **Clean Architecture**: Dependencies pointing towards the domain

## Installation and Execution

### Prerequisites

- Node.js 22+
- npm 11+
- Docker (for local development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ms-orders-management

# Install dependencies
npm install

# Setup environment (copy and configure)
cp .env.example .env
```

### Running the Application

```bash
# Use Docker Compose (recommended for development)
npm run docker:dev

# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## Project Structure

Complete structure documentation in [`docs/scaffolding.md`](docs/scaffolding.md).

```text
/src
  /domain
    /orders
      /entities           # Order (Aggregate Root), Product (Entity)
      /value-objects      # OrderId, CustomerId, ProductId, etc.
      /events             # OrderCreated, OrderConfirmed, etc.
      /repositories       # IOrderRepository (port)
      /services           # OrderDomainService
  /application
    /orders
      /dto                # DTOs for data transfer
      /services           # Application services
      /commands           # Application commands
      /controllers        # HTTP controllers
  /infrastructure
    /persistence/orders   # OrderTypeORMRepository (adapter)
    /messaging
      /kafka              # KafkaModule, KafkaEventAdapter
      /domain             # OrdersKafkaPublisher
  /modules                # NestJS module configuration
```

## Design Decisions and Trade-offs

### Architectural Decision Records

The project includes detailed ADRs documenting key architectural decisions:

- [ADR-001: DDD Architecture](docs/adr/adr-001-ddd-architecture.md)
- [ADR-002: Value Objects with Private Constructors](docs/adr/adr-002-value-objects-private-constructors.md)
- [ADR-003: Data Validation with Class-Transformer and Class-Validator](docs/adr/adr-003-data-validation.md)
- [ADR-004: Decoupled Event Publisher](docs/adr/adr-004-decoupled-event-publisher.md)
- [ADR-005: TypeORM for Database Infrastructure](docs/adr/adr-005-typeorm-database-infrastructure.md)


### Known Limitations and Future Improvements


### Simulated External Services

- **Inventory Management**: Simulated via Kafka events (stock.reserved, stock.rejected)
- **Payment Processing**: Interface ready, simulated responses
- **Customer Notifications**: Event-driven hooks implemented, handlers simulated

## Future Improvements

- **Performance Optimization**: Production-ready configuration and monitoring
- **Event Sourcing**: Complete audit trail for aggregate changes
- **CQRS Implementation**: Separate read/write models for scalability
- **API Documentation**: OpenAPI/Swagger for both legacy and DDD endpoints
- **Circuit Breakers**: Resilience patterns for external service integration

### Production Considerations

- **Monitoring**: Domain event metrics and business KPIs
- **Security**: Authentication and authorization (assumed pre-validated in headers)

## Time Investment

- **Design Phase**: ~2 hours (bounded contexts, aggregate design, architecture planning)
- **Implementation Phase**: ~30 hours (domain layer, application layer, infrastructure adapters)
- **Testing & Documentation**: ~8 hours (unit tests, integration tests, documentation)
- **Total**: ~40 hours of focused development

## Additional Documentation

- [**Architecture and Domain Model**](docs/architecture.md) - Technical design and applied patterns
- [**Bounded Contexts and Context Map**](docs/bounded-contexts.md) - Domain separation and integration
- [**ADRs - Architectural Decisions**](docs/adr/) - Documented technical decisions and trade-offs
- [**Project Structure**](docs/scaffolding.md) - Detailed folder structure and organization
