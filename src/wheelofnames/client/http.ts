import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../../axios";

import * as Dto from "./dto";

import configuration from "../../configuration";
import {PostResponse} from "./dto";

const wheelOfNamesApiUrl: string = configuration.wheelOfNames.apiUrl;
const wheelOfNamesApiKey: string = configuration.wheelOfNames.apiKey;

class WheelOfNamesHttpClient {

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

export default new WheelOfNamesHttpClient();
