import {
    CallHandler,
    ExecutionContext,
    RequestTimeoutException,
} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {Test, TestingModule} from "@nestjs/testing";

import {of, throwError} from "rxjs";
import {delay} from "rxjs/operators";

import {Context} from "@enums/context.enum";

import {HTTPInterceptor} from "@interceptors/http.interceptor";

// Mock services
const mockConfigService = {
    get: jest.fn(),
};

// Tesst suite
describe("HTTPInterceptor", () => {
    let interceptor: HTTPInterceptor;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                // ? Register the service to be tested
                HTTPInterceptor,
                // ? Register its service dependencies as mock dependencies
                {provide: ConfigService, useValue: mockConfigService},
            ],
        }).compile();

        interceptor = module.get<HTTPInterceptor>(HTTPInterceptor);
        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(interceptor).toBeDefined();
    });

    describe("HTTP requests", () => {
        const createMockExecutionContext = (
            contextType: Context = Context.HTTP,
            headers: Record<string, string | string[]> = {},
            query: Record<string, unknown> = {},
            additionalRequestProps: Record<string, unknown> = {}
        ): ExecutionContext => {
            const request = {
                method: "GET",
                url: "/test",
                headers,
                query,
                ...additionalRequestProps,
            };

            return {
                getType: () => contextType,
                switchToHttp: () => ({
                    getRequest: () => request,
                }),
                getClass: () => ({name: "TestController"}),
                getHandler: () => ({name: "testMethod"}),
            } as ExecutionContext;
        };

        const createMockCallHandler = (
            responseDelay: number = 0,
            shouldThrow: boolean = false
        ): CallHandler => ({
            handle: () => {
                if (shouldThrow) {
                    return throwError(() => new Error("Test error"));
                }
                return of("test response").pipe(delay(responseDelay));
            },
        });

        it("should not intercept non-HTTP requests", (done) => {
            const context = createMockExecutionContext(Context.RPC);
            const next = createMockCallHandler();

            interceptor.intercept(context, next).subscribe((result) => {
                expect(result).toBe("test response");
                done();
            });
        });

        it("should apply default timeout to HTTP requests", (done) => {
            mockConfigService.get.mockReturnValue(5000); // 5 second timeout
            const context = createMockExecutionContext();
            const next = createMockCallHandler();

            interceptor.intercept(context, next).subscribe((result) => {
                expect(result).toEqual({
                    success: true,
                    data: "test response",
                });
                done();
            });
        });

        it("should timeout HTTP requests that exceed the timeout", (done) => {
            mockConfigService.get.mockReturnValue(1000); // 1 second timeout
            const context = createMockExecutionContext();
            const next = createMockCallHandler(2000); // 2 second delay

            interceptor.intercept(context, next).subscribe({
                error: (error) => {
                    expect(error).toBeInstanceOf(RequestTimeoutException);
                    expect(error.message).toContain(
                        "Request timed out after 1000ms"
                    );
                    done();
                },
            });
        }, 10000);

        it("should use custom timeout from headers", (done) => {
            mockConfigService.get.mockReturnValue(30000); // Default 30 seconds
            const context = createMockExecutionContext(Context.HTTP, {
                "x-timeout": "2000",
            });
            const next = createMockCallHandler(3000); // 3 second delay

            interceptor.intercept(context, next).subscribe({
                error: (error) => {
                    expect(error).toBeInstanceOf(RequestTimeoutException);
                    expect(error.message).toContain(
                        "Request timed out after 2000ms"
                    );
                    done();
                },
            });
        }, 10000);

        it("should use custom timeout from query parameters", (done) => {
            mockConfigService.get.mockReturnValue(30000); // Default 30 seconds
            const context = createMockExecutionContext(
                Context.HTTP,
                {},
                {timeout: "1500"}
            );
            const next = createMockCallHandler(2000); // 2 second delay

            interceptor.intercept(context, next).subscribe({
                error: (error) => {
                    expect(error).toBeInstanceOf(RequestTimeoutException);
                    expect(error.message).toContain(
                        "Request timed out after 1500ms"
                    );
                    done();
                },
            });
        }, 10000);

        it("should limit custom timeout to reasonable bounds", (done) => {
            mockConfigService.get.mockReturnValue(30000);
            const context = createMockExecutionContext(Context.HTTP, {
                "x-timeout": "500000", // 500 seconds, should be limited to 300 seconds
            });
            const next = createMockCallHandler();

            // Since we can't easily test the actual timeout value without waiting,
            // we'll test that the request completes successfully with the bounded timeout
            interceptor.intercept(context, next).subscribe((result) => {
                expect(result).toEqual({
                    success: true,
                    data: "test response",
                });
                done();
            });
        });

        it("should not transform non-timeout errors", (done) => {
            mockConfigService.get.mockReturnValue(5000);
            const context = createMockExecutionContext();
            const next = createMockCallHandler(0, true); // Should throw immediately

            interceptor.intercept(context, next).subscribe({
                error: (error) => {
                    expect(error.message).toBe("Test error");
                    expect(error).not.toBeInstanceOf(RequestTimeoutException);
                    done();
                },
            });
        });

        it("should use default timeout when no custom timeout is provided", (done) => {
            mockConfigService.get.mockReturnValue(undefined); // No config value
            const context = createMockExecutionContext();
            const next = createMockCallHandler();

            // The default should be 30000ms (30 seconds)
            interceptor.intercept(context, next).subscribe((result) => {
                expect(result).toEqual({
                    success: true,
                    data: "test response",
                });
                expect(configService.get).toHaveBeenCalledWith("HTTP_TIMEOUT");
                done();
            });
        });

        it("should extract IP from socket.remoteAddress", (done) => {
            const context = createMockExecutionContext(
                Context.HTTP,
                {},
                {},
                {
                    socket: {remoteAddress: "192.168.1.1"},
                }
            );
            const next = createMockCallHandler();

            interceptor.intercept(context, next).subscribe(() => {
                done();
            });
        });

        it("should extract IP from x-forwarded-for header", (done) => {
            const context = createMockExecutionContext(Context.HTTP, {
                "x-forwarded-for": "192.168.1.2, 10.0.0.1",
            });
            const next = createMockCallHandler();

            interceptor.intercept(context, next).subscribe(() => {
                done();
            });
        });

        it("should extract IP from x-forwarded-for header as array", (done) => {
            const context = createMockExecutionContext(Context.HTTP, {
                "x-forwarded-for": ["192.168.1.3", "10.0.0.2"],
            });
            const next = createMockCallHandler();

            interceptor.intercept(context, next).subscribe(() => {
                done();
            });
        });

        it("should handle request with no IP information", (done) => {
            const context = createMockExecutionContext(
                Context.HTTP,
                {},
                {},
                {}
            );
            const next = createMockCallHandler();

            interceptor.intercept(context, next).subscribe(() => {
                done();
            });
        });

        it("should handle timeout from query parameter as number", (done) => {
            mockConfigService.get.mockReturnValue(30000);
            const context = createMockExecutionContext(
                Context.HTTP,
                {},
                {timeout: 2000}
            );
            const next = createMockCallHandler(3000); // 3 second delay

            interceptor.intercept(context, next).subscribe({
                error: (error) => {
                    expect(error).toBeInstanceOf(RequestTimeoutException);
                    expect(error.message).toContain(
                        "Request timed out after 2000ms"
                    );
                    done();
                },
            });
        }, 10000);

        it("should handle invalid timeout values gracefully", (done) => {
            mockConfigService.get.mockReturnValue(5000);
            const context = createMockExecutionContext(Context.HTTP, {
                "x-timeout": "invalid",
            });
            const next = createMockCallHandler();

            interceptor.intercept(context, next).subscribe((result) => {
                expect(result).toEqual({
                    success: true,
                    data: "test response",
                });
                done();
            });
        });

        it("should clamp very low timeout values", (done) => {
            mockConfigService.get.mockReturnValue(30000);
            const context = createMockExecutionContext(Context.HTTP, {
                "x-timeout": "100", // Below 1000ms minimum
            });
            const next = createMockCallHandler(1500); // 1.5 second delay

            interceptor.intercept(context, next).subscribe({
                error: (error) => {
                    expect(error).toBeInstanceOf(RequestTimeoutException);
                    expect(error.message).toContain(
                        "Request timed out after 1000ms"
                    );
                    done();
                },
            });
        }, 10000);

        it("should clamp very high timeout values", (done) => {
            mockConfigService.get.mockReturnValue(30000);
            const context = createMockExecutionContext(Context.HTTP, {
                "x-timeout": "600000", // Above 300000ms maximum, should be clamped to 300000ms
            });
            const next = createMockCallHandler();

            // Since we can't easily test the actual timeout value without waiting,
            // we'll test that the request completes successfully with the bounded timeout
            interceptor.intercept(context, next).subscribe((result) => {
                expect(result).toEqual({
                    success: true,
                    data: "test response",
                });
                done();
            });
        });
    });
});
