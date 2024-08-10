import axios, {AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse} from "axios";

const instance: AxiosInstance = axios.create();

instance.interceptors.request.use(async (request: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const message: {} = {
        "url": request.url,
        "method": request.method,
        "headers": request.headers,
        "data": request.data,
        "params": request.params
    };

    console.log("Request:\n", JSON.stringify(message, null, 2));
    return request;
});

instance.interceptors.response.use(async (response: AxiosResponse): Promise<AxiosResponse> => {
    const message: {} = {
        "status": response.status,
        "headers": response.headers,
        "data": response.data
    };

    console.log("Response:\n", JSON.stringify(message, null, 2));
    return response;
});

export {AxiosRequestConfig, AxiosResponse};

export default instance;
