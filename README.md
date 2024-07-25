# Sistema de Gestión de Pedidos (Hexagonal, DDD, Event-Driven)

Este proyecto implementa un microservicio de gestión de pedidos para un e-commerce, siguiendo principios de **Domain-Driven Design (DDD)**, **Arquitectura Hexagonal** y comunicación **event-driven**. Incluye lógica de compensación, validación de transiciones de estado y publicación/consumo de eventos de dominio.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura y Diseño](#arquitectura-y-diseño)
- [Instalación](#instalación)
- [Ejecución](#ejecución)
- [Testing](#testing)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Decisiones de Diseño](#decisiones-de-diseño)
- [Limitaciones y Mejoras Futuras](#limitaciones-y-mejoras-futuras)
- [Documentación Adicional](#documentación-adicional)

## Descripción

Microservicio para la gestión de pedidos, soportando:
- Estados: Pending, Confirmed, Shipped, Delivered, Cancelled
- Validación de transiciones de estado
- Cálculo de total de pedido
- Lógica de compensación (stock, cancelaciones)
- Comunicación por eventos (Kafka simulado)
- Testing unitario y end-to-end

## Arquitectura y Diseño

- **Hexagonal Architecture**: Separación clara entre dominio, infraestructura y aplicación.
- **DDD**: Agregado principal `Order`, entidades y eventos de dominio.
- **Event-Driven**: Publicación y consumo de eventos para integración con otros servicios (stock, pagos).
- **NestJS + TypeORM**: Framework y ORM para Node.js/TypeScript.
- **Testing**: Jest para unitarios y e2e.

Más detalles en [`docs/architecture.md`](docs/architecture.md).

## Instalación

```bash
pnpm install
# o npm install
```

## Ejecución

```bash
# Desarrollo
pnpm run start:dev

# Producción
pnpm run start:prod
```

## Testing

```bash
# Unit tests
pnpm run test

# End-to-end tests
pnpm run test:e2e

# Cobertura
pnpm run test:cov
```

## Estructura del Proyecto

```
/src
  /modules
    /orders
      /dtos
      /entities
      orders.controller.ts
      orders.service.ts
      orders.events.ts
      ...
  ...
/docs
  architecture.md
  bounded-contexts.md
  adr/
    adr-001.md
    adr-002.md
    ...
README.md
```

- **/src/modules/orders**: Lógica de dominio y aplicación de pedidos.
- **/docs**: Documentación técnica y de negocio.
- **/docs/adr**: Architecture Decision Records.

## Decisiones de Diseño

- DDD y Hexagonal para desacoplar dominio e infraestructura.
- Comunicación asíncrona por eventos para resiliencia y escalabilidad.
- Lógica de compensación para mantener consistencia ante fallos.
- Validación estricta de datos y transiciones de estado.

Ver [`docs/adr/`](docs/adr/) para detalles.

## Limitaciones y Mejoras Futuras

- La mensajería está simulada (no hay Kafka real).
- No se implementa autenticación/autorización.
- Faltan algunos tests e2e y de integración.
- Mejorar la gestión de errores y timeouts en eventos.

## Documentación Adicional

- [Arquitectura y Modelo de Dominio](docs/architecture.md)
- [Bounded Contexts y Context Map](docs/bounded-contexts.md)
- [ADRs - Decisiones Arquitectónicas](docs/adr/)
- [Guía de desarrollo y convenciones](docs/contributing.md)
