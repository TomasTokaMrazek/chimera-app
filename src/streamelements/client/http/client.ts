import {HttpService} from "@nestjs/axios";

import {AxiosRequestConfig, AxiosResponse} from "axios";
import {lastValueFrom} from "rxjs";

import * as Dto from "./dto";

import configuration from "@chimera/configuration";

const streamElementsApi: string = configuration.streamElements.apiUrl;

class StreamElementsHttpClient {

    private constructor(
        private readonly httpService: HttpService,
        private readonly jwt: string
    ) {}

    static createInstance(httpService: HttpService, jwt: string): StreamElementsHttpClient {
        return new StreamElementsHttpClient(httpService, jwt);
    }


    public getCurrentUser(): Promise<AxiosResponse<Dto.CurrentUserRequest>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return lastValueFrom(this.httpService.get(`${streamElementsApi}/users/current`, config));
    }

    public getCurrentUserChannel(): Promise<AxiosResponse<Dto.CurrentUserChannel>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return lastValueFrom(this.httpService.get(`${streamElementsApi}/channels/me`, config));
    }

    public getTips(channel: string, queryParams: Dto.TipListRequestParams): Promise<AxiosResponse<Dto.TipListResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            },
            params: queryParams
        };

        return lastValueFrom(this.httpService.get(`${streamElementsApi}/tips/${channel}`, config));
    }

    public createTip(channel: string, body: Dto.TipRequest): Promise<AxiosResponse<any>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return lastValueFrom(this.httpService.post(`${streamElementsApi}/tips/${channel}`, body, config));
    }

    public getTip(channel: string, tipId: string): Promise<AxiosResponse<any>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return lastValueFrom(this.httpService.get(`${streamElementsApi}/tips/${channel}/${tipId}`, config));
    }

}

export default StreamElementsHttpClient;
