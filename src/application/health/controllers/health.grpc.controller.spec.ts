import {ConfigService} from "@nestjs/config";
import {Test, TestingModule} from "@nestjs/testing";

import {HealthService} from "@application/health/services/health.service";

import {HealthgRPCController} from "@application/health/controllers/health.grpc.controller";

// Mock services
const mockConfigService = {
    get: jest.fn(),
};

const mockHealthService = {
    isHealthy: jest.fn(),
};

// Test suite
describe("HealthgRPCController", () => {
    let appController: HealthgRPCController;
    let healthService: HealthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            // ? Register the controller to be tested
            controllers: [HealthgRPCController],
            providers: [
                // ? Register its service dependencies as mock dependenciess
                {provide: HealthService, useValue: mockHealthService},
                // ? Register other service dependencies
                {provide: ConfigService, useValue: mockConfigService},
            ],
        }).compile();

        appController = module.get<HealthgRPCController>(HealthgRPCController);
        healthService = module.get<HealthService>(HealthService);
    });

    it("should be defined", () => {
        expect(appController).toBeDefined();
    });

    describe("isHealthy", () => {
        it("should return true when HealthService isHealthy is called", () => {
            const expectedResult = true;
            jest.spyOn(healthService, "isHealthy").mockImplementation(
                () => expectedResult
            );

            const result = appController.isHealthy();

            expect(result).toBe(expectedResult);
            expect(healthService.isHealthy).toHaveBeenCalled();
        });
    });
});
