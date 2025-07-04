import {ClientKafka} from "@nestjs/microservices";
import {Test, TestingModule} from "@nestjs/testing";

import {Context} from "@enums/context.enum";

import {ValidationFailedError} from "@domain/shared/errors/validation-failed.error";
import {KafkaExceptionFilter} from "@infrastructure/messaging/providers/kafka/kafka.filter";

describe("KafkaExceptionFilter", () => {
    let filter: KafkaExceptionFilter;
    let mockKafkaClient: jest.Mocked<ClientKafka>;

    beforeEach(async () => {
        mockKafkaClient = {
            emit: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KafkaExceptionFilter,
                {
                    provide: "KAFKA_CLIENT",
                    useValue: mockKafkaClient,
                },
            ],
        }).compile();

        filter = module.get<KafkaExceptionFilter>(KafkaExceptionFilter);
    });

    it("should be defined", () => {
        expect(filter).toBeDefined();
    });

    it("should re-throw exception for non-RPC contexts", () => {
        // Arrange
        const exception = new ValidationFailedError([]);
        const mockHost = {
            getType: () => Context.HTTP,
        } as any;

        // Act & Assert
        expect(() => filter.catch(exception, mockHost)).toThrow(exception);
        expect(mockKafkaClient.emit).not.toHaveBeenCalled();
    });
});
