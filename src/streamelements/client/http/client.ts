import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "@chimera/axios";

import * as Dto from "./dto";

import configuration from "@chimera/configuration";

const streamElementsApi: string = configuration.streamElements.apiUrl;

class StreamElementsHttpClient {

    private constructor(
        private readonly jwt: string
    ) {}

    static createInstance(jwt: string): StreamElementsHttpClient {
        return new StreamElementsHttpClient(jwt);
    }


    public getCurrentUser(): Promise<AxiosResponse<Dto.CurrentUserRequest>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return axiosInstance.get(`${streamElementsApi}/users/current`, config);
    }

    public getCurrentUserChannel(): Promise<AxiosResponse<Dto.CurrentUserChannel>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return axiosInstance.get(`${streamElementsApi}/channels/me`, config);
    }

    public getTips(channel: string, queryParams: Dto.TipListRequestParams): Promise<AxiosResponse<Dto.TipListResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            },
            params: queryParams
        };

        return axiosInstance.get(`${streamElementsApi}/tips/${channel}`, config);
    }

    public createTip(channel: string, body: Dto.TipRequest): Promise<AxiosResponse<any>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return axiosInstance.post(`${streamElementsApi}/tips/${channel}`, body, config);
    }

    public getTip(channel: string, tipId: string): Promise<AxiosResponse<any>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return axiosInstance.get(`${streamElementsApi}/tips/${channel}/${tipId}`, config);
    }

}

export default StreamElementsHttpClient;
