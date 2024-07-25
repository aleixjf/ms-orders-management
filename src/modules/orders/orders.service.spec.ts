import {BadRequestException, NotFoundException} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {Test, TestingModule} from "@nestjs/testing";
import {getRepositoryToken} from "@nestjs/typeorm";

import {OrderStatus} from "@enums/order-status.enum";

import {OrderDTO} from "@modules/orders/dtos/order.dto";
import {ProductDTO} from "@modules/orders/dtos/product.dto";
import {Order} from "@modules/orders/entities/order.entity";
import {Product} from "@modules/orders/entities/product.entity";

import {OrdersService} from "@modules/orders/orders.service";

// Mock services
const mockConfigService = {
    get: jest.fn(),
};

const mockClientKafka = {
    emit: jest.fn(),
    close: jest.fn(),
};

const mockOrdersRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

const mockProductsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

// Test suite
describe("OrdersService", () => {
    let service: OrdersService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                // ? Register the service to be tested
                OrdersService,
                // ? Register its service dependencies as mock dependencies
                {provide: ConfigService, useValue: mockConfigService},
                {provide: "KAFKA_CLIENT", useValue: mockClientKafka},
                {
                    provide: getRepositoryToken(Order),
                    useValue: mockOrdersRepository,
                },
                {
                    provide: getRepositoryToken(Product),
                    useValue: mockProductsRepository,
                },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
    });

    describe("getOrder", () => {
        it("should return an order DTO if found", (done) => {
            const orderEntity = {
                id: "1",
                status: OrderStatus.PENDING,
                customerId: "test-customer-1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                products: [],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.PENDING,
                        customerId: "test-customer-1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                        products: [],
                    })
                ),
            };
            mockOrdersRepository.findOne.mockResolvedValue(orderEntity);

            service.getOrder("1").subscribe((result) => {
                expect(result).toBeDefined();
                expect(result?.id).toBe("1");
                expect(mockOrdersRepository.findOne).toHaveBeenCalledWith({
                    where: {id: "1"},
                });
                done();
            });
        });

        it("should return null if order not found", (done) => {
            mockOrdersRepository.findOne.mockResolvedValue(null);

            service.getOrder("notfound").subscribe((result) => {
                expect(result).toBeNull();
                done();
            });
        });
    });

    describe("getOrders", () => {
        it("should return an array of order DTOs", (done) => {
            const orderEntities = [
                {
                    id: "1",
                    status: OrderStatus.PENDING,
                    customerId: "c1",
                    orderDate: new Date(Date.now()),
                    deliveryDate: new Date(Date.now()),
                    products: [],
                    toDTO: jest.fn().mockReturnValue(
                        new OrderDTO({
                            id: "1",
                            status: OrderStatus.PENDING,
                            customerId: "c1",
                            orderDate: Date.now(),
                            deliveryDate: Date.now(),
                            products: [],
                        })
                    ),
                },
                {
                    id: "2",
                    status: OrderStatus.PENDING,
                    customerId: "c2",
                    orderDate: new Date(Date.now()),
                    deliveryDate: new Date(Date.now()),
                    products: [],
                    toDTO: jest.fn().mockReturnValue(
                        new OrderDTO({
                            id: "2",
                            status: OrderStatus.PENDING,
                            customerId: "c2",
                            orderDate: Date.now(),
                            deliveryDate: Date.now(),
                            products: [],
                        })
                    ),
                },
            ];
            mockOrdersRepository.find.mockResolvedValue(orderEntities);

            service.getOrders().subscribe((result) => {
                expect(result).toHaveLength(2);
                expect(result[0].id).toBe("1");
                expect(result[1].id).toBe("2");
                done();
            });
        });
    });

    describe("createOrder", () => {
        it("should save and emit order created event", (done) => {
            const orderDTO = new OrderDTO({
                id: "1",
                status: OrderStatus.PENDING,
                customerId: "c1",
                orderDate: Date.now(),
                deliveryDate: Date.now(),
                products: [],
            });

            const savedEntity = {
                id: "1",
                status: OrderStatus.PENDING,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(orderDTO),
            };

            orderDTO.toEntity = jest.fn().mockReturnValue(savedEntity);
            orderDTO.toPlain = jest.fn().mockReturnValue({id: "1"});

            mockOrdersRepository.save.mockResolvedValue(savedEntity);

            service.createOrder(orderDTO).subscribe((result) => {
                expect(result).toBeDefined();
                expect(result.id).toBe("1");
                expect(mockClientKafka.emit).toHaveBeenCalledWith(
                    "orders.created",
                    {id: "1"}
                );
                done();
            });
        });
    });

    describe("updateOrder", () => {
        it("should update and emit order updated event", (done) => {
            const updatedOrderDTO = new OrderDTO({
                id: "1",
                status: OrderStatus.CONFIRMED,
                customerId: "c1",
                orderDate: Date.now(),
                deliveryDate: Date.now(),
                products: [],
            });

            const updatedEntity = {
                id: "1",
                status: OrderStatus.CONFIRMED,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(updatedOrderDTO),
            };

            updatedOrderDTO.toPlain = jest.fn().mockReturnValue({id: "1"});

            mockOrdersRepository.update.mockResolvedValue({affected: 1});
            mockOrdersRepository.findOne.mockResolvedValue(updatedEntity);

            service
                .updateOrder("1", {status: OrderStatus.CONFIRMED})
                .subscribe((result) => {
                    expect(result).toBeDefined();
                    expect(result?.status).toBe(OrderStatus.CONFIRMED);
                    expect(mockClientKafka.emit).toHaveBeenCalledWith(
                        "orders.updated",
                        {id: "1"}
                    );
                    done();
                });
        });

        it("should throw NotFoundException if order not found", (done) => {
            mockOrdersRepository.update.mockResolvedValue({affected: 0});

            service.updateOrder("notfound", {}).subscribe({
                error: (err) => {
                    expect(err).toBeInstanceOf(NotFoundException);
                    done();
                },
            });
        });
    });

    describe("deleteOrder", () => {
        it("should delete and emit order deleted event", (done) => {
            mockOrdersRepository.delete.mockResolvedValue({affected: 1});

            service.deleteOrder("1").subscribe((result) => {
                expect(mockClientKafka.emit).toHaveBeenCalledWith(
                    "orders.deleted",
                    {id: "1"}
                );
                expect(result).toBeUndefined();
                done();
            });
        });

        it("should throw NotFoundException if order not found", (done) => {
            mockOrdersRepository.delete.mockResolvedValue({affected: 0});

            service.deleteOrder("notfound").subscribe({
                error: (err) => {
                    expect(err).toBeInstanceOf(NotFoundException);
                    done();
                },
            });
        });
    });

    describe("requestConfirmation", () => {
        it("should emit stock.reserve if order is pending", (done) => {
            const orderEntity = {
                id: "1",
                status: OrderStatus.PENDING,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [{id: "p1", quantity: 2}],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.PENDING,
                        customerId: "c1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now(),
                        products: [new ProductDTO({id: "p1", quantity: 2})],
                    })
                ),
            };

            mockOrdersRepository.findOne.mockResolvedValue(orderEntity);

            service.requestConfirmation("1").subscribe(() => {
                expect(mockClientKafka.emit).toHaveBeenCalledWith(
                    "stock.reserve",
                    {
                        order: "1",
                        products: [new ProductDTO({id: "p1", quantity: 2})],
                    }
                );
                done();
            });
        });

        it("should throw NotFoundException if order not found", (done) => {
            mockOrdersRepository.findOne.mockResolvedValue(null);

            service.requestConfirmation("notfound").subscribe({
                error: (err) => {
                    expect(err).toBeInstanceOf(NotFoundException);
                    done();
                },
            });
        });

        it("should throw error if order is not pending", (done) => {
            const orderEntity = {
                id: "1",
                status: OrderStatus.CONFIRMED,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.CONFIRMED,
                        customerId: "c1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now(),
                        products: [],
                    })
                ),
            };

            mockOrdersRepository.findOne.mockResolvedValue(orderEntity);

            service.requestConfirmation("1").subscribe({
                error: (err) => {
                    expect(err).toBeInstanceOf(BadRequestException);
                    expect(err.message).toMatch(/cannot be confirmed/);
                    done();
                },
            });
        });
    });

    describe("processOrder", () => {
        it("should call confirmOrder if success is true", (done) => {
            const orderEntity = {
                id: "1",
                status: OrderStatus.PENDING,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.PENDING,
                        customerId: "c1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now(),
                        products: [],
                    })
                ),
            };

            const confirmedEntity = {
                id: "1",
                status: OrderStatus.CONFIRMED,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.CONFIRMED,
                        customerId: "c1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now(),
                        products: [],
                    })
                ),
            };

            // Mock both calls - first for getOrder in confirmOrder, then for updateOrder
            mockOrdersRepository.findOne
                .mockResolvedValueOnce(orderEntity)
                .mockResolvedValueOnce(confirmedEntity);
            mockOrdersRepository.update.mockResolvedValue({affected: 1});

            service.processOrder("1", {success: true}).subscribe((result) => {
                expect(result).toBeDefined();
                expect(result.status).toBe(OrderStatus.CONFIRMED);
                done();
            });
        });

        it("should call cancelOrder if success is false", (done) => {
            const orderEntity = {
                id: "1",
                status: OrderStatus.PENDING,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.PENDING,
                        customerId: "c1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now(),
                        products: [],
                    })
                ),
            };

            const cancelledEntity = {
                id: "1",
                status: OrderStatus.CANCELLED,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.CANCELLED,
                        customerId: "c1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now(),
                        products: [],
                    })
                ),
            };

            mockOrdersRepository.findOne
                .mockResolvedValueOnce(orderEntity)
                .mockResolvedValueOnce(cancelledEntity);
            mockOrdersRepository.update.mockResolvedValue({affected: 1});

            service
                .processOrder("1", {success: false, reason: "fail"})
                .subscribe((result) => {
                    expect(result).toBeDefined();
                    expect(result.status).toBe(OrderStatus.CANCELLED);
                    done();
                });
        });
    });

    describe("confirmOrder", () => {
        it("should update status and emit orders.confirmed", (done) => {
            const orderEntity = {
                id: "1",
                status: OrderStatus.PENDING,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.PENDING,
                        customerId: "c1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now(),
                        products: [],
                    })
                ),
            };

            const confirmedEntity = {
                id: "1",
                status: OrderStatus.CONFIRMED,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.CONFIRMED,
                        customerId: "c1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now(),
                        products: [],
                    })
                ),
            };

            mockOrdersRepository.findOne
                .mockResolvedValueOnce(orderEntity)
                .mockResolvedValueOnce(confirmedEntity);
            mockOrdersRepository.update.mockResolvedValue({affected: 1});

            service.confirmOrder("1").subscribe((result) => {
                expect(result).toBeDefined();
                expect(result.status).toBe(OrderStatus.CONFIRMED);
                expect(mockClientKafka.emit).toHaveBeenCalledWith(
                    "orders.confirmed",
                    {id: "1"}
                );
                done();
            });
        });

        it("should throw NotFoundException if order not found", (done) => {
            mockOrdersRepository.findOne.mockResolvedValue(null);

            service.confirmOrder("notfound").subscribe({
                error: (err) => {
                    expect(err).toBeInstanceOf(NotFoundException);
                    done();
                },
            });
        });

        it("should throw error if order is not pending", (done) => {
            const orderEntity = {
                id: "1",
                status: OrderStatus.CONFIRMED,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.CONFIRMED,
                        customerId: "c1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now(),
                        products: [],
                    })
                ),
            };

            mockOrdersRepository.findOne.mockResolvedValue(orderEntity);

            service.confirmOrder("1").subscribe({
                error: (err) => {
                    expect(err).toBeInstanceOf(BadRequestException);
                    expect(err.message).toMatch(/cannot be confirmed/);
                    done();
                },
            });
        });
    });

    describe("cancelOrder", () => {
        it("should update status and emit orders.cancelled", (done) => {
            const orderEntity = {
                id: "1",
                status: OrderStatus.PENDING,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.PENDING,
                        customerId: "c1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now(),
                        products: [],
                    })
                ),
            };

            const cancelledEntity = {
                id: "1",
                status: OrderStatus.CANCELLED,
                customerId: "c1",
                orderDate: new Date(Date.now()),
                deliveryDate: new Date(Date.now()),
                products: [],
                toDTO: jest.fn().mockReturnValue(
                    new OrderDTO({
                        id: "1",
                        status: OrderStatus.CANCELLED,
                        customerId: "c1",
                        orderDate: Date.now(),
                        deliveryDate: Date.now(),
                        products: [],
                    })
                ),
            };

            mockOrdersRepository.findOne
                .mockResolvedValueOnce(orderEntity)
                .mockResolvedValueOnce(cancelledEntity);
            mockOrdersRepository.update.mockResolvedValue({affected: 1});

            service.cancelOrder("1", "reason").subscribe((result) => {
                expect(result).toBeDefined();
                expect(result.status).toBe(OrderStatus.CANCELLED);
                expect(mockClientKafka.emit).toHaveBeenCalledWith(
                    "orders.cancelled",
                    {id: "1", reason: "reason"}
                );
                done();
            });
        });

        it("should throw NotFoundException if order not found", (done) => {
            mockOrdersRepository.findOne.mockResolvedValue(null);

            service.cancelOrder("notfound").subscribe({
                error: (err) => {
                    expect(err).toBeInstanceOf(NotFoundException);
                    done();
                },
            });
        });
    });
});
