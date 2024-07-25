import {ConfigService} from "@nestjs/config";
import {Test, TestingModule} from "@nestjs/testing";

import {AppService} from "@modules/app/app.service";

import {AppHttpController} from "@modules/app/controllers/app.http.controller";

// Mock services
const mockConfigService = {
    get: jest.fn(),
};

const mockAppService = {
    isHealthy: jest.fn(),
};

// Test suite
describe("AppHttpController", () => {
    let appController: AppHttpController;
    let appService: AppService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            // ? Register the controller to be tested
            controllers: [AppHttpController],
            providers: [
                // ? Register its service dependencies as mock dependenciess
                {provide: AppService, useValue: mockAppService},
                // ? Register other service dependencies
                {provide: ConfigService, useValue: mockConfigService},
            ],
        }).compile();

        appController = module.get<AppHttpController>(AppHttpController);
        appService = module.get<AppService>(AppService);
    });

    it("should be defined", () => {
        expect(appController).toBeDefined();
    });

    describe("isHealthy", () => {
        it("should return true when AppService isHealthy is called", () => {
            // Arrange
            const expectedResult = true;
            jest.spyOn(appService, "isHealthy").mockImplementation(
                () => expectedResult
            );

            // Act
            const result = appController.isHealthy();

            // Assert
            expect(result).toBe(expectedResult);
            expect(appService.isHealthy).toHaveBeenCalled();
        });
    });
});
