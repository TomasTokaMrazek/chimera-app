import {HttpService} from "@nestjs/axios";

import {AxiosRequestConfig, AxiosResponse} from "axios";
import {lastValueFrom} from "rxjs";

import * as Dto from "./dto";

import configuration from "@chimera/configuration";

const wheelOfNamesApiUrl: string = configuration.wheelOfNames.apiUrl;
const wheelOfNamesApiKey: string = configuration.wheelOfNames.apiKey;

class WheelOfNamesHttpClient {

    private constructor(
        private readonly httpService: HttpService
    ) {}

    static createInstance(httpService: HttpService): WheelOfNamesHttpClient {
        return new WheelOfNamesHttpClient(httpService);
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

        return lastValueFrom(this.httpService.post(`${wheelOfNamesApiUrl}/wheels/shared`, body, config));
    }

}

export default WheelOfNamesHttpClient;
