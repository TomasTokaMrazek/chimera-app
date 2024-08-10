import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "@chimera/axios";

import * as Dto from "./dto";

import configuration from "@chimera/configuration";

const wheelOfNamesApiUrl: string = configuration.wheelOfNames.apiUrl;
const wheelOfNamesApiKey: string = configuration.wheelOfNames.apiKey;

class WheelOfNamesHttpClient {

    static createInstance(): WheelOfNamesHttpClient {
        return new WheelOfNamesHttpClient();
    }

    public createSharedWheel(body: Dto.PostRequest): Promise<AxiosResponse<Dto.PostResponse>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "x-api-key": wheelOfNamesApiKey
            }
        };

        return axiosInstance.post(`${wheelOfNamesApiUrl}/wheels/shared`, body, config);
    }

}

export default WheelOfNamesHttpClient;
