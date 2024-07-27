import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from "axios";

function axiosInstance(): AxiosInstance {
    const instance: AxiosInstance = axios.create();

    instance.interceptors.request.use(request => {
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

    instance.interceptors.response.use(response => {
        const message: {} = {
            "status": response.status,
            "headers": response.headers,
            "data": response.data
        };

        console.log("Response:\n", JSON.stringify(message, null, 2));
        return response;
    });

    return instance;
}

export {AxiosRequestConfig, AxiosResponse};

export default axiosInstance();
