import {NotFoundException} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {Test, TestingModule} from "@nestjs/testing";

import {of, throwError} from "rxjs";

import {OrderStatus} from "@enums/order-status.enum";

import {OrderDTO} from "@application/orders/dtos/order.dto";

import {OrdersAppService} from "@application/orders/services/orders.application.service";

import {OrdersHTTPController} from "@application/orders/controllers/orders.http.controller";

import {CreateOrderCommand} from "@application/orders/commands/create-order.command";

// Mock services
const mockConfigService = {
    get: jest.fn(),
};

const mockOrdersAppService = {
    getOrder: jest.fn(),
    getOrders: jest.fn(),
    createOrder: jest.fn(),
    reserveOrder: jest.fn(),
    confirmOrder: jest.fn(),
    cancelOrder: jest.fn(),
    shipOrder: jest.fn(),
    deliverOrder: jest.fn(),
};

// Test suite
describe("OrdersHTTPController", () => {
    let controller: OrdersHTTPController;
    let ordersService: OrdersAppService;

    beforeEach(async () => {
        // ? Clear all mocks before each test to ensure a clean state
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            // ? Register the controller to be tested
            controllers: [OrdersHTTPController],
            providers: [
                // ? Register its service dependencies as mock dependencies
                {provide: OrdersAppService, useValue: mockOrdersAppService},
                // ? Register other service dependencies
                {provide: ConfigService, useValue: mockConfigService},
            ],
        }).compile();

        controller = module.get<OrdersHTTPController>(OrdersHTTPController);
        ordersService = module.get<OrdersAppService>(OrdersAppService);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    describe("getOrder", () => {
        it("should return an order if found", (done) => {
            const id = "123";
            const order: OrderDTO = {
                id,
                status: OrderStatus.PENDING,
                customerId: "test-customer-1",
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [],
                price: 0,
            };
            mockOrdersAppService.getOrder.mockReturnValue(of(order));

            controller.getOrder(id).subscribe((response) => {
                expect(ordersService.getOrder).toHaveBeenCalledWith(id);
                expect(response).toEqual(order);
                done();
            });
        });

        it("should throw NotFoundException if order not found", (done) => {
            const id = "123";
            const errorMessage = `Order with ID ${id} not found`;
            mockOrdersAppService.getOrder.mockReturnValue(
                throwError(() => new NotFoundException(errorMessage))
            );

            controller.getOrder(id).subscribe({
                error: (err) => {
                    expect(ordersService.getOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(NotFoundException);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });

        it("should handle service error when getting an order", (done) => {
            const id = "error-id";
            const errorMessage = "Service unavailable";
            mockOrdersAppService.getOrder.mockReturnValue(
                throwError(() => new Error(errorMessage))
            );

            controller.getOrder(id).subscribe({
                error: (err) => {
                    expect(ordersService.getOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(Error);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });
    });

    describe("getOrders", () => {
        it("should return an array of orders", (done) => {
            const orders: OrderDTO[] = [
                {
                    id: "1",
                    status: OrderStatus.PENDING,
                    customerId: "test-customer-1",
                    orderDate: Date.now(),
                    deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    products: [],
                    price: 0,
                },
                {
                    id: "2",
                    status: OrderStatus.SHIPPED,
                    customerId: "test-customer-2",
                    orderDate: Date.now(),
                    deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    products: [],
                    price: 0,
                },
            ];
            mockOrdersAppService.getOrders.mockReturnValue(of(orders));

            controller.getOrders().subscribe((response) => {
                expect(ordersService.getOrders).toHaveBeenCalledWith();
                expect(response).toEqual(orders);
                done();
            });
        });

        it("should return an empty array if no orders are found", (done) => {
            mockOrdersAppService.getOrders.mockReturnValue(of([]));

            controller.getOrders().subscribe((response) => {
                expect(ordersService.getOrders).toHaveBeenCalledWith();
                expect(response).toEqual([]);
                done();
            });
        });
    });

    describe("createOrder", () => {
        it("should create a new order and return it", (done) => {
            const dto: CreateOrderCommand = {
                customerId: "cust1",
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [
                    {
                        id: "prod1",
                        quantity: 1,
                        name: "Product 1",
                        description: "Test product",
                        price: 10.0,
                    },
                ],
            };
            const order: OrderDTO = {
                id: "generated-uuid",
                status: OrderStatus.PENDING,
                customerId: dto.customerId,
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [
                    {
                        id: "prod1",
                        quantity: 1,
                        name: "Product 1",
                        description: "Test product",
                        price: 10.0,
                    },
                ],
                price: 10.0,
            };
            mockOrdersAppService.createOrder.mockReturnValue(of(order));

            controller.createOrder(dto).subscribe((response) => {
                expect(ordersService.createOrder).toHaveBeenCalledWith(dto);
                expect(response).toEqual(order);
                done();
            });
        });

        it("should handle service error during order creation", (done) => {
            const dto: CreateOrderCommand = {
                customerId: "test",
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [
                    {
                        id: "prod1",
                        quantity: 1,
                        name: "Product 1",
                        description: "Test product",
                        price: 10.0,
                    },
                ],
            };
            const errorMessage = "Database error";
            mockOrdersAppService.createOrder.mockReturnValue(
                throwError(() => new Error(errorMessage))
            );

            controller.createOrder(dto).subscribe({
                error: (err) => {
                    expect(ordersService.createOrder).toHaveBeenCalledWith(dto);
                    expect(err).toBeInstanceOf(Error);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });
    });

    describe("confirmOrder", () => {
        it("should confirm an order and return", (done) => {
            const id = "order-to-confirm";
            mockOrdersAppService.reserveOrder.mockReturnValue(of(void 0));

            controller.confirmOrder(id).subscribe((response) => {
                expect(ordersService.reserveOrder).toHaveBeenCalledWith(id);
                expect(response).toBe(void 0);
                done();
            });
        });

        it("should throw NotFoundException if order to confirm is not found", (done) => {
            const id = "non-existent-order";
            const errorMessage = `Order with ID ${id} not found`;
            mockOrdersAppService.reserveOrder.mockReturnValue(
                throwError(() => new NotFoundException(errorMessage))
            );

            controller.confirmOrder(id).subscribe({
                error: (err) => {
                    expect(ordersService.reserveOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(NotFoundException);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });

        it("should throw error when invalid state transition during order confirmation", (done) => {
            const id = "error-id";
            const errorMessage = `Order with id ${id} cannot be confirmed because it is not in ${OrderStatus.PENDING} status`;
            mockOrdersAppService.reserveOrder.mockReturnValue(
                throwError(() => new Error(errorMessage))
            );

            controller.confirmOrder(id).subscribe({
                error: (err) => {
                    expect(ordersService.reserveOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(Error);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });
    });

    describe("cancelOrder", () => {
        it("should cancel an order and return", (done) => {
            const id = "order-to-cancel";
            mockOrdersAppService.cancelOrder.mockReturnValue(of(void 0));

            controller.cancelOrder(id).subscribe((response) => {
                expect(ordersService.cancelOrder).toHaveBeenCalledWith(id);
                expect(response).toBe(void 0);
                done();
            });
        });

        it("should throw NotFoundException if order to cancel is not found", (done) => {
            const id = "non-existent-order";
            const errorMessage = `Order with ID ${id} not found`;
            mockOrdersAppService.cancelOrder.mockReturnValue(
                throwError(() => new NotFoundException(errorMessage))
            );

            controller.cancelOrder(id).subscribe({
                error: (err) => {
                    expect(ordersService.cancelOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(NotFoundException);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });

        it("should handle service error during order cancellation", (done) => {
            const id = "error-id";
            const errorMessage = "Cancellation failed";
            mockOrdersAppService.cancelOrder.mockReturnValue(
                throwError(() => new Error(errorMessage))
            );

            controller.cancelOrder(id).subscribe({
                error: (err) => {
                    expect(ordersService.cancelOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(Error);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });
    });

    describe("shipOrder", () => {
        it("should ship an order and return", (done) => {
            const id = "order-to-ship";
            mockOrdersAppService.shipOrder.mockReturnValue(of(void 0));

            controller.shipOrder(id).subscribe((response) => {
                expect(ordersService.shipOrder).toHaveBeenCalledWith(id);
                expect(response).toBe(void 0);
                done();
            });
        });

        it("should throw NotFoundException if order to ship is not found", (done) => {
            const id = "non-existent-order";
            const errorMessage = `Order with ID ${id} not found`;
            mockOrdersAppService.shipOrder.mockReturnValue(
                throwError(() => new NotFoundException(errorMessage))
            );

            controller.shipOrder(id).subscribe({
                error: (err) => {
                    expect(ordersService.shipOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(NotFoundException);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });

        it("should handle service error during order shipping", (done) => {
            const id = "error-id";
            const errorMessage = "Shipping failed";
            mockOrdersAppService.shipOrder.mockReturnValue(
                throwError(() => new Error(errorMessage))
            );

            controller.shipOrder(id).subscribe({
                error: (err) => {
                    expect(ordersService.shipOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(Error);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });
    });

    describe("deliverOrder", () => {
        it("should deliver an order and return", (done) => {
            const id = "order-to-deliver";
            mockOrdersAppService.deliverOrder.mockReturnValue(of(void 0));

            controller.deliverOrder(id).subscribe((response) => {
                expect(ordersService.deliverOrder).toHaveBeenCalledWith(id);
                expect(response).toBe(void 0);
                done();
            });
        });

        it("should throw NotFoundException if order to deliver is not found", (done) => {
            const id = "non-existent-order";
            const errorMessage = `Order with ID ${id} not found`;
            mockOrdersAppService.deliverOrder.mockReturnValue(
                throwError(() => new NotFoundException(errorMessage))
            );

            controller.deliverOrder(id).subscribe({
                error: (err) => {
                    expect(ordersService.deliverOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(NotFoundException);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });

        it("should handle service error during order delivery", (done) => {
            const id = "error-id";
            const errorMessage = "Delivery failed";
            mockOrdersAppService.deliverOrder.mockReturnValue(
                throwError(() => new Error(errorMessage))
            );

            controller.deliverOrder(id).subscribe({
                error: (err) => {
                    expect(ordersService.deliverOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(Error);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });
    });
});
