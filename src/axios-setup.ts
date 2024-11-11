import axios, {AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse, Axios} from "axios";
import {Logger} from "@nestjs/common";

const instance: AxiosInstance = axios.create();

const logger: Logger = new Logger(Axios.name);

instance.interceptors.request.use(async (request: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const message: {} = {
        "url": request.url,
        "method": request.method,
        "headers": request.headers,
        "data": request.data,
        "params": request.params
    };

    logger.log("Request:\n", JSON.stringify(message, null, 2));
    return request;
});

instance.interceptors.response.use(async (response: AxiosResponse): Promise<AxiosResponse> => {
    const message: {} = {
        "status": response.status,
        "headers": response.headers,
        "data": response.data
    };

    logger.log("Response:\n", JSON.stringify(message, null, 2));
    return response;
});

export {AxiosRequestConfig, AxiosResponse};

export default instance;
