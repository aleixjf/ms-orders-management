import {INestApplication} from "@nestjs/common";
import {ClientKafka, KafkaContext} from "@nestjs/microservices";
import {Test, TestingModule} from "@nestjs/testing";
import {getRepositoryToken} from "@nestjs/typeorm";

import {firstValueFrom, Observable} from "rxjs";

import request from "supertest";
import {Repository} from "typeorm";
import {v4 as uuidv4} from "uuid";

import {AppModule} from "@src/app.module";

import {OrderStatus} from "@enums/order-status.enum";

import {ProductDTO} from "@application/orders/dtos/product.dto";
import {Order} from "@infrastructure/persistence/orders/entities/order.typeorm.entity";
import {Product} from "@infrastructure/persistence/orders/entities/product.typeorm.entity";

import {CreateOrderCommand} from "@application/orders/commands/create-order.command";
import {OrdersPatterns} from "@domain/orders/events/patterns/orders.patterns";
import {StockPatterns} from "@domain/orders/events/patterns/stock.patterns";
import {OrdersKafkaConsumer} from "@infrastructure/messaging/providers/kafka/consumers/orders.consumer";

interface EmittedEvent {
    pattern: string;
    data: unknown;
    timestamp: string;
}

interface OrderResponse {
    id: string;
    status: OrderStatus;
    customerId: string;
    orderDate: number;
    deliveryDate: number;
    products: ProductDTO[];
    price: number;
}

describe("Orders Complete E2E Flow (DDD Implementation)", () => {
    let app: INestApplication;
    let orderRepository: Repository<Order>;
    let productRepository: Repository<Product>;
    let kafkaClient: Partial<ClientKafka>;
    let consumers: {orders: OrdersKafkaConsumer};

    const emittedEvents: EmittedEvent[] = [];
    const lastEvent: () => EmittedEvent = () => emittedEvents.slice(-1)[0];

    const mockedKafkaContext = (topic: string): KafkaContext =>
        ({
            getTopic: () => topic,
        }) as unknown as KafkaContext;

    beforeAll(async () => {
        // ? Mock Kafka client for testing
        // This is a mock implementation of the Kafka client that will be used to capture emitted events and simulate sending messages.
        // This allows us to test the event-driven architecture without needing a real Kafka broker.
        kafkaClient = {
            emit: jest.fn((pattern: string, data: unknown) => {
                emittedEvents.push({
                    pattern,
                    data,
                    timestamp: new Date().toISOString(),
                });
                return new Observable();
            }),
            send: jest.fn().mockReturnValue(new Observable()),
            close: jest.fn(),
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider("KAFKA_CLIENT")
            .useValue(kafkaClient)
            .compile();

        app = moduleFixture.createNestApplication();

        // ? Initialize repositories
        orderRepository = moduleFixture.get<Repository<Order>>(
            getRepositoryToken(Order)
        );
        productRepository = moduleFixture.get<Repository<Product>>(
            getRepositoryToken(Product)
        );

        // ? Initialize the Kafka consumer
        consumers = {
            orders: moduleFixture.get<OrdersKafkaConsumer>(OrdersKafkaConsumer),
        };

        // ? Initialize the application
        await app.init();
    });

    beforeEach(async () => {
        // ? Delete all products first to avoid FK constraint errors
        await productRepository.deleteAll();
        await orderRepository.deleteAll();

        // ? Clear emitted events before each test
        emittedEvents.length = 0;

        // ? Clear all mocks
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // ? Delete all products first to avoid FK constraint errors
        await productRepository.deleteAll();
        await orderRepository.deleteAll();

        // ? Close the application
        await app.close();

        // ? Clear all mocks
        jest.clearAllMocks();
    });

    describe("Complete Order Flow", () => {
        it("should create, confirm, ship and deliver an order + emit necessary events", async () => {
            // Step 1: Create the order
            const customerId = uuidv4();
            const orderDate = Date.now();
            const deliveryDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
            const dto: CreateOrderCommand = {
                customerId,
                orderDate,
                deliveryDate,
                products: [
                    {
                        id: uuidv4(),
                        quantity: 2,
                        name: "Product 1",
                        description: "Test product 1",
                        price: 10.0,
                    },
                    {
                        id: uuidv4(),
                        quantity: 1,
                        name: "Product 2",
                        description: "Test product 2",
                        price: 20.0,
                    },
                ],
            };
            const createResponse = await request(app.getHttpServer())
                .post("/orders")
                .send(dto)
                .expect(201);
            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data).toHaveProperty("id");
            expect(createResponse.body.data.status).toBe(OrderStatus.PENDING);
            expect(createResponse.body.data.customerId).toBe(customerId);
            expect(createResponse.body.data.products).toHaveLength(2);
            expect(createResponse.body.data).toHaveProperty("price");
            expect(lastEvent().pattern).toBe(OrdersPatterns.CREATED);

            const orderId = createResponse.body.data.id;

            // ? Verify order was saved in database
            const savedOrder = await orderRepository.findOne({
                where: {id: orderId},
                relations: ["products"],
            });
            expect(savedOrder).toBeDefined();
            expect(savedOrder?.status).toBe(OrderStatus.PENDING);
            expect(savedOrder?.products).toHaveLength(2);

            // Step 2: Get single order
            const getResponse = await request(app.getHttpServer())
                .get(`/orders/${orderId}`)
                .expect(200);
            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.id).toBe(orderId);
            expect(getResponse.body.data.status).toBe(OrderStatus.PENDING);

            // Step 3: List all orders
            const listResponse = await request(app.getHttpServer())
                .get("/orders")
                .expect(200);
            expect(listResponse.body.success).toBe(true);
            expect(listResponse.body.data).toHaveLength(1);
            const foundOrder = listResponse.body.data.find(
                (order: OrderResponse) => order.id === orderId
            );
            expect(foundOrder).toBeDefined();

            // Step 4: Confirm the order (should trigger stock reservation)
            const confirmResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/confirm`)
                .expect(200);
            expect(confirmResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(StockPatterns.RESERVE);

            // Step 5: Simulate stock reservation success received through Kafka
            // ? We will simulate receiving the Kafka event by directly calling the OrdersKafkaConsumers consumer method
            await new Promise((resolve) => setTimeout(resolve, 100)); // ? Simulate async operation
            await firstValueFrom(
                consumers.orders.stockReserved(
                    {id: orderId},
                    mockedKafkaContext(StockPatterns.RESERVED)
                )
            );
            expect(lastEvent().pattern).toBe(OrdersPatterns.CONFIRMED);

            // ? Verify order status is updated to CONFIRMED
            const confirmedOrder = await orderRepository.findOne({
                where: {id: orderId},
            });
            expect(confirmedOrder?.status).toBe(OrderStatus.CONFIRMED);

            // Step 6: Ship the order
            const shipResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/ship`)
                .expect(200);
            expect(shipResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(OrdersPatterns.SHIPPED);

            // ? Verify order status is updated to SHIPPED
            const shippedOrder = await orderRepository.findOne({
                where: {id: orderId},
            });
            expect(shippedOrder?.status).toBe(OrderStatus.SHIPPED);

            // Step 7: Deliver the order
            const deliverResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/deliver`)
                .expect(200);
            expect(deliverResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(OrdersPatterns.DELIVERED);

            // ? Verify order status is updated to DELIVERED
            const deliveredOrder = await orderRepository.findOne({
                where: {id: orderId},
            });
            expect(deliveredOrder?.status).toBe(OrderStatus.DELIVERED);
        });
    });

    describe("Order Cancellation Flow", () => {
        it("should allow cancellation of pending orders + emit events", async () => {
            // Step 1: Create the order
            const customerId = uuidv4();
            const orderDate = Date.now();
            const deliveryDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
            const dto: CreateOrderCommand = {
                customerId,
                orderDate,
                deliveryDate,
                products: [
                    {
                        id: uuidv4(),
                        quantity: 1,
                        name: "Test Product",
                        description: "Test product description",
                        price: 15.0,
                    },
                ],
            };
            const createResponse = await request(app.getHttpServer())
                .post("/orders")
                .send(dto)
                .expect(201);
            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data.status).toBe(OrderStatus.PENDING);
            expect(lastEvent().pattern).toBe(OrdersPatterns.CREATED);

            const orderId = createResponse.body.data.id;

            // Step 2: Cancel the order
            const cancelResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/cancel`)
                .expect(200);
            expect(cancelResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(OrdersPatterns.CANCELLED);

            // ? Verify order status is updated to CANCELLED
            const cancelledOrder = await orderRepository.findOne({
                where: {id: orderId},
            });
            expect(cancelledOrder?.status).toBe(OrderStatus.CANCELLED);
        });

        it("should not allow cancellation of shipped/delivered orders + proper error handling", async () => {
            // Step 1: Create the order
            const customerId = uuidv4();
            const dto: CreateOrderCommand = {
                customerId,
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [
                    {
                        id: uuidv4(),
                        quantity: 1,
                        name: "Test Product",
                        description: "Test product description",
                        price: 10.0,
                    },
                ],
            };
            const createResponse = await request(app.getHttpServer())
                .post("/orders")
                .send(dto)
                .expect(201);
            expect(createResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(OrdersPatterns.CREATED);

            const orderId = createResponse.body.data.id;

            // Step 2: Confirm the order (should trigger stock reservation)
            const confirmResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/confirm`)
                .expect(200);

            expect(confirmResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(StockPatterns.RESERVE);

            // Step 3: Simulate stock reservation success received through Kafka
            // ? We will simulate receiving the Kafka event by directly calling the OrdersKafkaConsumers consumer method
            await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for async operations to complete
            await firstValueFrom(
                consumers.orders.stockReserved(
                    {id: orderId},
                    mockedKafkaContext(StockPatterns.RESERVED)
                )
            );
            expect(lastEvent().pattern).toBe(OrdersPatterns.CONFIRMED);

            // ? Verify order status is updated to CONFIRMED
            const confirmedOrder = await orderRepository.findOne({
                where: {id: orderId},
            });
            expect(confirmedOrder?.status).toBe(OrderStatus.CONFIRMED);

            // Step 4: Ship the order
            const shipResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/ship`)
                .expect(200);
            expect(shipResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(OrdersPatterns.SHIPPED);

            // ? Verify order status is updated to SHIPPED
            const shippedOrder = await orderRepository.findOne({
                where: {id: orderId},
            });
            expect(shippedOrder?.status).toBe(OrderStatus.SHIPPED);

            // Step 5: Cancel the order - should fail
            const cancelResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/cancel`)
                .expect(400);
            expect(cancelResponse.body.success).toBe(false);
            expect(cancelResponse.error).toBeDefined();
        });
    });

    describe("Order State Transition Validation + Stock Integration Events", () => {
        it("should handle stock reservation success flow + emit events", async () => {
            // Step 1: Create order
            const customerId = uuidv4();
            const dto: CreateOrderCommand = {
                customerId,
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [
                    {
                        id: uuidv4(),
                        quantity: 1,
                        name: "Test Product",
                        description: "Test product description",
                        price: 15.0,
                    },
                ],
            };
            const createResponse = await request(app.getHttpServer())
                .post("/orders")
                .send(dto)
                .expect(201);
            expect(createResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(OrdersPatterns.CREATED);

            const orderId = createResponse.body.data.id;

            // Step 2: Confirm the order (should trigger stock reservation)
            const confirmResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/confirm`)
                .expect(200);

            expect(confirmResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(StockPatterns.RESERVE);

            // Step 3: Simulate stock reservation success received through Kafka
            // ? We will simulate receiving the Kafka event by directly calling the OrdersKafkaConsumers consumer method
            await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for async operations to complete
            await firstValueFrom(
                consumers.orders.stockReserved(
                    {id: orderId},
                    mockedKafkaContext(StockPatterns.RESERVED)
                )
            );
            expect(lastEvent().pattern).toBe(OrdersPatterns.CONFIRMED);

            // ? Verify order status is updated to CONFIRMED
            const confirmedOrder = await orderRepository.findOne({
                where: {id: orderId},
            });
            expect(confirmedOrder?.status).toBe(OrderStatus.CONFIRMED);
        });

        it("should handle stock rejection and cancel order + emit events", async () => {
            // Step 1: Create order
            const customerId = uuidv4();
            const dto: CreateOrderCommand = {
                customerId,
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [
                    {
                        id: uuidv4(),
                        quantity: 1,
                        name: "Test Product",
                        description: "Test product description",
                        price: 20.0,
                    },
                ],
            };
            const createResponse = await request(app.getHttpServer())
                .post("/orders")
                .send(dto)
                .expect(201);
            expect(createResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(OrdersPatterns.CREATED);

            const orderId = createResponse.body.data.id;

            // Step 2: Confirm the order (should trigger stock reservation)
            const confirmResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/confirm`)
                .expect(200);

            expect(confirmResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(StockPatterns.RESERVE);

            // Step 3: Simulate stock reservation rejection received through Kafka
            // ? We will simulate receiving the Kafka event by directly calling the OrdersKafkaConsumers consumer method
            await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for async operations to complete
            await firstValueFrom(
                consumers.orders.stockRejected(
                    {id: orderId},
                    mockedKafkaContext(StockPatterns.REJECTED)
                )
            );
            expect(lastEvent().pattern).toBe(OrdersPatterns.CANCELLED);

            // ? Verify order status is updated to CANCELLED
            const cancelledOrder = await orderRepository.findOne({
                where: {id: orderId},
            });
            expect(cancelledOrder?.status).toBe(OrderStatus.CANCELLED);
        });

        it("should not allow shipping before confirming the order", async () => {
            // Step 1: Create the order
            const customerId = uuidv4();
            const dto: CreateOrderCommand = {
                customerId,
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [
                    {
                        id: uuidv4(),
                        quantity: 1,
                        name: "Test Product",
                        description: "Test product description",
                        price: 12.0,
                    },
                ],
            };
            const createResponse = await request(app.getHttpServer())
                .post("/orders")
                .send(dto)
                .expect(201);
            expect(createResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(OrdersPatterns.CREATED);

            const orderId = createResponse.body.data.id;

            // Step 2: Ship the order - should fail
            const shipResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/ship`)
                .expect(400);
            expect(shipResponse.body.success).toBe(false);
            expect(shipResponse.body.error).toBeDefined();
        });

        it("should not allow delivering before shipping the order", async () => {
            // Step 1: Create order
            const customerId = uuidv4();
            const dto: CreateOrderCommand = {
                customerId,
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [
                    {
                        id: uuidv4(),
                        quantity: 1,
                        name: "Test Product",
                        description: "Test product description",
                        price: 8.0,
                    },
                ],
            };
            const createResponse = await request(app.getHttpServer())
                .post("/orders")
                .send(dto)
                .expect(201);
            expect(createResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(OrdersPatterns.CREATED);

            const orderId = createResponse.body.data.id;

            // Step 2: Confirm the order (should trigger stock reservation)
            const confirmResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/confirm`)
                .expect(200);

            expect(confirmResponse.body.success).toBe(true);
            expect(lastEvent().pattern).toBe(StockPatterns.RESERVE);

            // Step 3: Simulate stock reservation success received through Kafka
            // ? We will simulate receiving the Kafka event by directly calling the OrdersKafkaConsumers consumer method
            await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for async operations to complete
            await firstValueFrom(
                consumers.orders.stockReserved(
                    {id: orderId},
                    mockedKafkaContext(StockPatterns.RESERVED)
                )
            );
            expect(lastEvent().pattern).toBe(OrdersPatterns.CONFIRMED);

            // ? Verify order status is updated to CONFIRMED
            const confirmedOrder = await orderRepository.findOne({
                where: {id: orderId},
            });
            expect(confirmedOrder?.status).toBe(OrderStatus.CONFIRMED);

            // Step 4: Deliver the order - should fail
            const deliverResponse = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/deliver`)
                .expect(400);
            expect(deliverResponse.body.success).toBe(false);
            expect(deliverResponse.body.error).toBeDefined();
        });
    });

    describe("Data validation and error handling", () => {
        it("Create order - missing customerId", async () => {
            const invalidOrder: Omit<CreateOrderCommand, "customerId"> = {
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [
                    {
                        id: uuidv4(),
                        quantity: 1,
                        price: 10.0,
                    },
                ],
            };

            const response = await request(app.getHttpServer())
                .post("/orders")
                .send(invalidOrder)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        it("Create order - missing/empty product data", async () => {
            const invalidOrder: CreateOrderCommand = {
                customerId: uuidv4(),
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [],
            };

            const response = await request(app.getHttpServer())
                .post("/orders")
                .send(invalidOrder)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        it("Create order - missing product data", async () => {
            const invalidOrder: Omit<CreateOrderCommand, "products"> = {
                customerId: uuidv4(),
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
            };

            const response = await request(app.getHttpServer())
                .post("/orders")
                .send(invalidOrder)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        it("should handle non-existent order operations with proper error responses", async () => {
            const nonExistentId = uuidv4();

            // Try to get non-existent order
            const getResponse = await request(app.getHttpServer())
                .get(`/orders/${nonExistentId}`)
                .expect(404);
            expect(getResponse.body.success).toBe(false);
            expect(getResponse.body.error).toBeDefined();

            // Try to confirm non-existent order
            const confirmResponse = await request(app.getHttpServer())
                .patch(`/orders/${nonExistentId}/confirm`)
                .expect(404);
            expect(confirmResponse.body.success).toBe(false);
            expect(confirmResponse.body.error).toBeDefined();

            // Try to cancel non-existent order
            const cancelResponse = await request(app.getHttpServer())
                .patch(`/orders/${nonExistentId}/cancel`)
                .expect(404);
            expect(cancelResponse.body.success).toBe(false);
            expect(cancelResponse.body.error).toBeDefined();

            // Try to ship non-existent order
            const shipResponse = await request(app.getHttpServer())
                .patch(`/orders/${nonExistentId}/ship`)
                .expect(404);
            expect(shipResponse.body.success).toBe(false);
            expect(shipResponse.body.error).toBeDefined();

            // Try to deliver non-existent order
            const deliverResponse = await request(app.getHttpServer())
                .patch(`/orders/${nonExistentId}/deliver`)
                .expect(404);
            expect(deliverResponse.body.success).toBe(false);
            expect(deliverResponse.body.error).toBeDefined();
        });
    });
});
