import {HttpStatus} from "@nestjs/common";

import {Request} from "express";

export interface CustomHttpError {
    code: number;
    status: string;
    exception: string; // e.g. "HttpException", "BadRequestException"
    message: string;
    cause: string;
    timestamp: string;
    path: string;
    method: string;
}

export const customHttpError = ({
    code = HttpStatus.INTERNAL_SERVER_ERROR,
    status = "Internal Server Error",
    exception = "HttpException",
    message = "An unexpected error occurred",
    cause,
    request,
}: {
    code?: number;
    status?: string;
    exception?: string;
    message?: string;
    cause?: string;
    request: Request;
}): {
    success: false;
    error: CustomHttpError;
} => ({
    success: false,
    error: {
        code,
        status,
        exception,
        message,
        cause,
        timestamp: new Date().toISOString(),
        method: request.method,
        path: request.url,
    },
});
