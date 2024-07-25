import {Logger} from "@nestjs/common";

import {
    AxiosError,
    AxiosInterceptorOptions,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from "axios";

const logger = new Logger("AxiosInterceptor");

const RequestSuccessInterceptor:
    | ((
          value: InternalAxiosRequestConfig
      ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>)
    | null = (config) => {
    logger.debug(
        "Intercepted external HTTP request",
        config.method?.toUpperCase(),
        config.url
        // config.data
    );
    return config;
};

const RequestFailedInterceptor: (error: any) => any = (error) => {
    logger.debug("Intercepted external HTTP request (FAILED)");
    if (error instanceof AxiosError) {
        // ? Since we are throing it, it will be captured by AxiosExceptionFilter, where it will be logged, therefore we don't need to log it here as well
        // console.debug("Caught Axios error in an external HTTP request");
        // ? After throwing the AxiosError, it should be caught by the AxiosExceptionFilter
        throw error;
    } else
        logger.error(
            "Error in external HTTP request",
            error.response?.status,
            error.response?.data
        );
    return Promise.reject(error);
};

const ResponseSuccessInterceptor:
    | ((response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>)
    | null = (response) => {
    logger.debug("Intercepted external HTTP response", {
        status: `${response.status} (${response.statusText})`,
        // data: response.data,
        // headers: response.headers,
        // request: response.config,
    });
    return response;
};

const ResponseFailedInterceptor: (error: AxiosError) => Promise<AxiosError> = (
    error
) => {
    logger.debug("Intercepted external HTTP response (FAILED)");
    if (error instanceof AxiosError) {
        // ? Since we are throing it, it will be captured by AxiosExceptionFilter, where it will be logged, therefore we don't need to log it here as well
        // console.debug("Caught Axios error in an external HTTP response");
        // ? After throwing the AxiosError, it should be caught by the AxiosExceptionFilter
        throw error;
    } else logger.error("Error in external HTTP response", error);
    return Promise.reject(error);
};

export const AxiosInterceptor: {
    request: {
        success: (
            value: InternalAxiosRequestConfig
        ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
        error: (error: any) => any;
        configuration: AxiosInterceptorOptions;
    };
    response: {
        success: (
            response: AxiosResponse
        ) => AxiosResponse | Promise<AxiosResponse>;
        error: (error: any) => any;
        configuration: AxiosInterceptorOptions;
    };
} = {
    request: {
        success: RequestSuccessInterceptor,
        error: RequestFailedInterceptor,
        configuration: {},
    },
    response: {
        success: ResponseSuccessInterceptor,
        error: ResponseFailedInterceptor,
        configuration: {},
    },
};
