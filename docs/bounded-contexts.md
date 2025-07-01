# Bounded Contexts and Context Map

## 1. **Order Management**

**Responsibilities**:

- Creation, updating and complete order lifecycle
- State transition validation and business rules
- Order total calculation and product management
- Domain event generation for external integrations

**Main Entities**:

- **Order** (Aggregate Root)
  - `id`: string (UUID)
  - `customerId`: string (customer UUID)
  - `orderDate`: number (Unix timestamp)
  - `deliveryDate`: number (Unix timestamp)
  - `status`: OrderStatus (enum)
  - `products`: Product[] (product collection)

- **Product** (Entity)
  - `id`: string (product UUID)
  - `quantity`: number (ordered quantity)
  - `name`: string (optional)
  - `description`: string (optional)
  - `price`: string (unit price)

**Value Objects**:

- `OrderId`, `CustomerId`, `ProductId`, `ProductQuantity`, `OrderDate`

**Domain Events**:

- `orders.created` - When a new order is created
- `orders.confirmed` - When an order is confirmed
- `orders.shipped` - When an order is shipped
- `orders.delivered` - When an order is delivered
- `orders.cancelled` - When an order is cancelled

- `stock.reserve` - Stock reservation request
- `stock.compensate` - Stock compensation request

**Protected business invariants:**

1. **Valid state transitions**:
   - Only PENDING orders can be confirmed
   - Only CONFIRMED orders can be shipped
   - Only SHIPPED orders can be delivered
   - SHIPPED or DELIVERED orders cannot be cancelled

2. **Product integrity**:
   - An order must have at least one product
   - Quantities must be positive
   - Total order price is calculated automatically based on products and quantities

3. **Consistent dates**:
   - Delivery date must be after order date

4. **Automatic compensation**:
   - If a CONFIRMED order is cancelled, stock is automatically released

## 2. **Inventory Management**

**Responsibilities**:

- Product stock reservation and release
- Inventory availability verification
- Automatic compensation on cancellations

**Consumed Events**:

- `stock.reserve` - Stock reservation request
- `stock.compensate` - Release/compensation request

**Produced Events**:

- `stock.reserved` - Successful reservation confirmation
- `stock.rejected` - Reservation rejection due to lack of stock

## 3. **Payment Management**

**Responsibilities**:

- Payment authorization and processing
- Payment method validation
- Refund and compensation management

**Consumed Events**:

- `payment.process` - Payment processing request

**Produced Events**:

- `payment.processed` - Successful payment confirmation
- `payment.failed` - Processing failure

## Separation Justification

### 1. **Business Autonomy**

Each context has specific business rules and independent data models that can evolve separately.

### 2. **Technical Scalability**

Allows scaling each service according to its specific load and performance requirements.

### 3. **Team Independence**

Development teams can work autonomously on each context without blocking dependencies.

### 4. **Single Responsibility**

Each context has a specific and well-defined reason to change.

### 5. **Loose Coupling**

Communication is done through events, minimizing direct dependencies and increasing resilience.

## Service Communication

**Asynchronous Communication (Event-Driven):**

- **Main pattern**: Domain events via Kafka
- **Advantages**: Decoupling, resilience, scalability
- **Usage**: Business operations, notifications, state updates

**Synchronous Communication (when necessary):**

- **gRPC**: For communication between bounded contexts (preferable to HTTP for performance)
- **HTTP**: For public APIs and external integrations  (but an API gateway should be considered for better management).

**Error Handling:**

- **Dead Letter Queues (DLQ)**: For messages that fail processing

- **Interceptors**: For error handling (timeouts included) aside from logging and performance monitoring
