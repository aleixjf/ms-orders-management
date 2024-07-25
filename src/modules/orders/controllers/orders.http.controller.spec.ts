import {NotFoundException} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {ClientKafka} from "@nestjs/microservices";
import {Test, TestingModule} from "@nestjs/testing";

import {of, throwError} from "rxjs";

import {OrderStatus} from "@enums/order-status.enum";

import {CancelOrderRequestDTO} from "@modules/orders/dtos/cancel-order.request.dto";
import {ConfirmOrderRequestDTO} from "@modules/orders/dtos/confirm-order.request.dto";
import {CreateOrderRequestDTO} from "@modules/orders/dtos/create-order.request.dto";
import {DeleteOrderRequestDTO} from "@modules/orders/dtos/delete-order.request.dto";
import {GetOrderRequestDTO} from "@modules/orders/dtos/get-order.request.dto";
import {GetOrdersRequestDTO} from "@modules/orders/dtos/get-orders.request.dto";
import {OrderDTO} from "@modules/orders/dtos/order.dto";
import {ProductDTO} from "@modules/orders/dtos/product.dto";
import {UpdateOrderStatusRequestDTO} from "@modules/orders/dtos/update-order-status.request.dto";
import {UpdateOrderRequestDTO} from "@modules/orders/dtos/update-order.request.dto";

import {OrdersService} from "@modules/orders/orders.service";

import {OrdersHTTPController} from "@modules/orders/controllers/orders.http.controller";

// Mock services
const mockConfigService = {
    get: jest.fn(),
};

const mockClientKafka = {
    emit: jest.fn(),
};

const mockOrdersService = {
    getOrder: jest.fn(),
    getOrders: jest.fn(),
    createOrder: jest.fn(),
    updateOrder: jest.fn(),
    deleteOrder: jest.fn(),
    requestConfirmation: jest.fn(),
    confirmOrder: jest.fn(),
    cancelOrder: jest.fn(),
};

// Test suite
describe("OrdersHTTPController", () => {
    let controller: OrdersHTTPController;
    let ordersService: OrdersService;
    let clientKafka: ClientKafka;

    beforeEach(async () => {
        // ? Clear all mocks before each test to ensure a clean state
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            // ? Register the controller to be tested
            controllers: [OrdersHTTPController],
            providers: [
                // ? Register its service dependencies as mock dependencies
                {provide: "KAFKA_CLIENT", useValue: mockClientKafka},
                {provide: OrdersService, useValue: mockOrdersService},
                // ? Register other service dependencies
                {provide: ConfigService, useValue: mockConfigService},
            ],
        }).compile();

        controller = module.get<OrdersHTTPController>(OrdersHTTPController);
        ordersService = module.get<OrdersService>(OrdersService);
        clientKafka = module.get<ClientKafka>("KAFKA_CLIENT");
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    describe("getOrder", () => {
        it("should return an order if found", (done) => {
            const id = "123";
            const dto: GetOrderRequestDTO = {id};
            const order = new OrderDTO({
                id,
                status: OrderStatus.PENDING,
                customerId: "test-customer-1",
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [],
            });
            mockOrdersService.getOrder.mockReturnValue(of(order));

            controller.getOrder(dto.id).subscribe((response) => {
                expect(ordersService.getOrder).toHaveBeenCalledWith(id);
                expect(response).toEqual(order);
                done();
            });
        });

        it("should throw NotFoundException if order not found", (done) => {
            const id = "123";
            const dto: GetOrderRequestDTO = {id};
            const errorMessage = `Order with ID ${id} not found`;
            mockOrdersService.getOrder.mockReturnValue(
                throwError(() => new NotFoundException(errorMessage))
            );

            controller.getOrder(dto.id).subscribe({
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
            const dto: GetOrderRequestDTO = {id};
            const errorMessage = "Service unavailable";
            mockOrdersService.getOrder.mockReturnValue(
                throwError(() => new Error(errorMessage))
            );

            controller.getOrder(dto.id).subscribe({
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
            const orders = [
                new OrderDTO({
                    id: "1",
                    status: OrderStatus.PENDING,
                    customerId: "test-customer-1",
                    orderDate: Date.now(),
                    deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    products: [],
                }),
                new OrderDTO({
                    id: "2",
                    status: OrderStatus.SHIPPED,
                    customerId: "test-customer-2",
                    orderDate: Date.now(),
                    deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    products: [],
                }),
            ];
            const dto: GetOrdersRequestDTO = {
                ids: orders.map((order) => order.id),
            };
            mockOrdersService.getOrders.mockReturnValue(of(orders));

            controller.getOrders(dto).subscribe((response) => {
                expect(ordersService.getOrders).toHaveBeenCalledWith(dto.ids);
                expect(response).toEqual(orders);
                done();
            });
        });

        it("should return an empty array if no orders are found", (done) => {
            const dto: GetOrdersRequestDTO = {ids: []};
            mockOrdersService.getOrders.mockReturnValue(of([]));

            controller.getOrders(dto).subscribe((response) => {
                expect(ordersService.getOrders).toHaveBeenCalledWith(dto.ids);
                expect(response).toEqual([]);
                done();
            });
        });
    });

    describe("createOrder", () => {
        it("should create a new order and return it", (done) => {
            const dto: CreateOrderRequestDTO = {
                customerId: "cust1",
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [new ProductDTO({id: "prod1", quantity: 1})],
            };
            const order = new OrderDTO({
                ...dto,
                id: "generated-uuid",
                status: OrderStatus.PENDING,
            });
            mockOrdersService.createOrder.mockReturnValue(of(order));

            controller.createOrder(dto).subscribe((response) => {
                expect(ordersService.createOrder).toHaveBeenCalledWith(
                    expect.objectContaining({
                        // ? Ensure the service was called with an object that matches the DTO structure
                        id: expect.any(String), // Ensure an ID was generated by the service
                        status: OrderStatus.PENDING,
                        customerId: dto.customerId,
                        products: expect.arrayContaining([
                            expect.objectContaining({
                                id: expect.any(String), // Assuming product IDs might also be generated
                                quantity: 1,
                            }),
                        ]),
                    })
                );
                expect(response).toEqual(order);
                done();
            });
        });

        it("should handle service error during order creation", (done) => {
            const dto: CreateOrderRequestDTO = {
                customerId: "test",
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [new ProductDTO({id: "prod1", quantity: 1})],
            };
            const errorMessage = "Database error";
            mockOrdersService.createOrder.mockReturnValue(
                throwError(() => new Error(errorMessage))
            );

            controller.createOrder(dto).subscribe({
                error: (err) => {
                    expect(ordersService.createOrder).toHaveBeenCalledWith(
                        expect.objectContaining({
                            // ? Ensure the service was called with an object that matches the DTO structure
                            id: expect.any(String), // Ensure an ID was generated by the service
                            status: OrderStatus.PENDING,
                            customerId: dto.customerId,
                            products: expect.arrayContaining([
                                expect.objectContaining({
                                    id: expect.any(String), // Assuming product IDs might also be generated
                                    quantity: 1,
                                }),
                            ]),
                        })
                    );
                    expect(err).toBeInstanceOf(Error);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });
    });

    describe("updateOrder", () => {
        it("should update an existing order and return the updated order", (done) => {
            const id = "1";
            const dto: UpdateOrderRequestDTO = {
                id,
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
            };
            const order = new OrderDTO({
                ...dto,
                status: OrderStatus.PENDING,
                customerId: "test",
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [new ProductDTO({id: "prod2", quantity: 2})],
            });
            mockOrdersService.updateOrder.mockReturnValue(of(order));

            controller.updateOrder(dto.id, dto).subscribe((response) => {
                expect(ordersService.updateOrder).toHaveBeenCalledWith(id, dto);
                expect(response).toEqual(order);
                done();
            });
        });

        it("should throw NotFoundException if order to update is not found", (done) => {
            const id = "non-existent-id";
            const dto: UpdateOrderRequestDTO = {
                id,
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
            };
            const errorMessage = `Order with ID ${id} not found`;
            mockOrdersService.updateOrder.mockReturnValue(
                throwError(() => new NotFoundException(errorMessage))
            );

            controller.updateOrder(dto.id, dto).subscribe({
                error: (err) => {
                    expect(ordersService.updateOrder).toHaveBeenCalledWith(
                        id,
                        dto
                    );
                    expect(err).toBeInstanceOf(NotFoundException);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });
    });

    describe("updateOrderStatus", () => {
        it("should update an order status", (done) => {
            const id = "1";
            const dto: UpdateOrderStatusRequestDTO = {
                id,
                status: OrderStatus.CONFIRMED,
            };
            const order = new OrderDTO({
                ...dto,
                customerId: "test-customer-1",
                orderDate: Date.now(),
                deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                products: [],
            });
            mockOrdersService.updateOrder.mockReturnValue(of(order));

            controller.updateOrderStatus(dto.id, dto).subscribe((response) => {
                expect(ordersService.updateOrder).toHaveBeenCalledWith(id, dto);
                expect(response).toEqual(order);
                done();
            });
        });

        it("should throw NotFoundException if order to update is not found", (done) => {
            const id = "non-existent-id";
            const dto: UpdateOrderStatusRequestDTO = {
                id,
                status: OrderStatus.CONFIRMED,
            };
            const errorMessage = `Order with ID ${id} not found`;
            mockOrdersService.updateOrder.mockReturnValue(
                throwError(() => new NotFoundException(errorMessage))
            );

            controller.updateOrder(dto.id, dto).subscribe({
                error: (err) => {
                    expect(ordersService.updateOrder).toHaveBeenCalledWith(
                        id,
                        dto
                    );
                    expect(err).toBeInstanceOf(NotFoundException);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });
    });

    describe("deleteOrder", () => {
        it("should delete an order and return", (done) => {
            const id = "1";
            const dto: DeleteOrderRequestDTO = {id};
            mockOrdersService.deleteOrder.mockReturnValue(of(void 0));

            controller.deleteOrder(dto.id).subscribe((response) => {
                expect(ordersService.deleteOrder).toHaveBeenCalledWith(id);
                expect(response).toBe(void 0);
                done();
            });
        });

        it("should throw NotFoundException if order to delete is not found", (done) => {
            const id = "non-existent";
            const dto: DeleteOrderRequestDTO = {id};
            const errorMessage = `Order with ID ${id} not found`;
            mockOrdersService.deleteOrder.mockReturnValue(
                throwError(() => new NotFoundException(errorMessage))
            );
            controller.deleteOrder(dto.id).subscribe({
                error: (err) => {
                    expect(ordersService.deleteOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(NotFoundException);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });

        it("should handle service error during order deletion", (done) => {
            const id = "error-id";
            const dto: DeleteOrderRequestDTO = {id};
            const errorMessage = "Permissions denied";
            mockOrdersService.deleteOrder.mockReturnValue(
                throwError(() => new Error(errorMessage))
            );

            controller.deleteOrder(dto.id).subscribe({
                error: (err) => {
                    expect(ordersService.deleteOrder).toHaveBeenCalledWith(id);
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
            const dto: ConfirmOrderRequestDTO = {id};
            mockOrdersService.requestConfirmation.mockReturnValue(of(void 0));

            controller.confirmOrder(dto.id).subscribe((response) => {
                expect(ordersService.requestConfirmation).toHaveBeenCalledWith(
                    id
                );
                expect(response).toBe(void 0);
                done();
            });
        });

        it("should throw NotFoundException if order to confirm is not found", (done) => {
            const id = "non-existent-order";
            const dto: ConfirmOrderRequestDTO = {id};
            const errorMessage = `Order with ID ${id} not found`;
            mockOrdersService.requestConfirmation.mockReturnValue(
                throwError(() => new NotFoundException(errorMessage))
            );

            controller.confirmOrder(dto.id).subscribe({
                error: (err) => {
                    expect(
                        ordersService.requestConfirmation
                    ).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(NotFoundException);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });

        it("should throw error when invalid state transition during order confirmation", (done) => {
            const id = "error-id";
            const dto: ConfirmOrderRequestDTO = {id};
            const errorMessage = `Order with id ${id} cannot be confirmed because it is not in ${OrderStatus.PENDING} status`;
            mockOrdersService.requestConfirmation.mockReturnValue(
                throwError(() => new Error(errorMessage))
            );

            controller.confirmOrder(dto.id).subscribe({
                error: (err) => {
                    expect(
                        ordersService.requestConfirmation
                    ).toHaveBeenCalledWith(id);
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
            const dto: CancelOrderRequestDTO = {id};
            mockOrdersService.cancelOrder.mockReturnValue(of(void 0));

            controller.cancelOrder(dto.id).subscribe((response) => {
                expect(ordersService.cancelOrder).toHaveBeenCalledWith(id);
                expect(response).toBe(void 0);
                done();
            });
        });

        it("should throw NotFoundException if order to cancel is not found", (done) => {
            const id = "non-existent-order";
            const dto: CancelOrderRequestDTO = {id};
            const errorMessage = `Order with ID ${id} not found`;
            mockOrdersService.cancelOrder.mockReturnValue(
                throwError(() => new NotFoundException(errorMessage))
            );

            controller.cancelOrder(dto.id).subscribe({
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
            const dto: CancelOrderRequestDTO = {id};
            const errorMessage = "Cancellation failed";
            mockOrdersService.cancelOrder.mockReturnValue(
                throwError(() => new Error(errorMessage))
            );

            controller.cancelOrder(dto.id).subscribe({
                error: (err) => {
                    expect(ordersService.cancelOrder).toHaveBeenCalledWith(id);
                    expect(err).toBeInstanceOf(Error);
                    expect(err.message).toBe(errorMessage);
                    done();
                },
            });
        });
    });
});
