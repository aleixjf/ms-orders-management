# Project Scaffolding - Post DDD Migration

```text
/src
  /domain                           # ✅ DOMAIN LAYER - Pure business logic
    /orders
      /entities                     # Aggregate Roots and Entities
        order.entity.ts             # Order (Aggregate Root) with business logic
        product.entity.ts           # Product (Entity) within the aggregate
      /value-objects                # Immutable Value Objects
        order-id.vo.ts              # OrderId with private constructor
        customer-id.vo.ts           # CustomerId with validation
        product-id.vo.ts            # ProductId with factory methods
        product-quantity.vo.ts      # ProductQuantity with validation > 0
        order-date.vo.ts            # OrderDate with validated format
      /events                       # Domain events
        orders.events.ts            # OrderCreated, OrderConfirmed, etc.
        /patterns                   # Domain event patterns enums
          *.patterns.ts             # Order related event patterns (e.g., OrderCreated)
      /repositories                 # Repository ports (interfaces)
        order.repository.ts         # IOrderRepository (domain port)
      /errors                       # Domain-specific errors that extend DomainError
        *.error.ts                  # e.g., AlreadyCancelledError, InvalidOrderStatusTransitionError
      /services                     # Domain services
        order.domain.service.ts     # OrderDomainService (pure orchestration)

    /shared
      /errors                       # Shared domain errors
        domain.error.ts             # Base class for all domain errors
        *.error.ts                  # Generic domain errors (e.g., ValidationFailedError, TransformationFailedError)
      /events                       # Shared domain event interfaces
        domain-event.interface.ts   # Domain event interface for all domain events
        domain-event.class.ts       # Base class for all domain events



  /application                      # ✅ APPLICATION LAYER - Use case coordination
    /orders
      /commands                     # Application commands
        create-order.command.ts     # CreateOrderCommand
        update-order.command.ts     # UpdateOrderCommand
        *.command.ts                # Other commands as needed
      /dto                          # DTOs for data transfer
        order.dto.ts                # OrderDTO with validation
        product.dto.ts              # ProductDTO with validation
      /mappers                      # Application mappers
        order.mapper.ts             # OrderMapper (DTO ↔ Domain transformation)
      /services                     # Application services
        orders.application.service.ts # OrdersAppService (coordination with DTOs)
      /controllers                  # Controllers for HTTP and gRPC
        orders.http.controller.ts   # OrdersHTTPController
        orders.grpc.controller.ts   # OrdersGRPCController
      orders.module.ts              # NestJS configuration module



  /infrastructure                   # ✅ INFRASTRUCTURE LAYER - External adapters
    /persistence
      database.module.ts            # Main database module
      /orders
        order.typeorm.repository.ts # OrderTypeORMRepository (adapter)
        /entities                   # TypeORM entities
          order.typeorm.entity.ts   # TypeORM entity for persistence
          product.entity.ts         # TypeORM entity for products
        /mappers
          order.mapper.ts           # Domain ↔ TypeORM transformation

    /messaging                      # Agnostic messaging layer
      messaging.module.ts           # Main agnostic messaging module
      messaging-config.service.ts   # Centralized messaging configuration
      messaging-provider.factory.ts # Factory for messaging providers
      /interfaces
        message.interface.ts        # Messaging contracts
        publisher.interface.ts      # Event Publisher interface
        subscriber.interface.ts     # Event Subscriber interface
        messaging-provider.interface.ts # Messaging provider interface
      /adapters
        publisher.adapter.ts        # Event Publisher Adapter
        subscriber.adapter.ts       # Event Subscriber Adapter
      /providers
        /kafka
          kafka.module.ts           # KafkaModule with async configuration
          kafka.filter.ts         # KafkaExceptionFilter (error handling)
          /adapters
            kafka-event.publisher.adapter.ts # KafkaEventPublisherAdapter (event publishing)
            kafka-event.subscriber.adapter.ts # KafkaEventSubscriberAdapter (event subscription)
            kafka-messaging.provider.ts # KafkaMessagingProvider (implementation of messaging provider interface)
          /consumers
            orders.kafka.consumer.ts # OrdersKafkaConsumer (updated for DDD)

    /logging                        # Logging configuration

    /configuration                  # Centralized configuration for the application
      configuration.module.ts       # Main configuration module
      configuration.ts              # Configuration service for accessing environment variables
      validation.ts                 # Validation schema for configuration



/test                               # ✅ COMPLETE TESTING
  app.e2e-spec.ts                   # End-to-end tests for both implementations
  orders.e2e-spec.ts                # Specific tests for orders DDD vs Legacy



/database                           # Database configuration
  /migrations                       # Database migrations
  /seeds                            # Test data
```
