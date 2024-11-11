import {HttpService} from "@nestjs/axios";

import {AxiosRequestConfig, AxiosResponse} from "axios";
import {lastValueFrom} from "rxjs";

import * as Dto from "./dto";

import configuration from "@chimera/configuration";

const streamLabsApiUrl: string = configuration.streamLabs.apiUrl;

const redirectUri: string = configuration.streamLabs.redirectUri;
const clientID: string = configuration.streamLabs.clientId;
const clientSecret: string = configuration.streamLabs.clientSecret;

class StreamLabsHttpClient {

    private constructor(
        private readonly httpService: HttpService,
        private readonly accessToken: string
    ) {}

    static createInstance(httpService: HttpService, accessToken: string): StreamLabsHttpClient {
        return new StreamLabsHttpClient(httpService, accessToken);
    }


    public getOauthTokens(authorizationCode: string): Promise<AxiosResponse<Dto.TokenResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const params: Dto.TokenRequestParams = {
            "grant_type": "authorization_code",
            "code": authorizationCode,
            "redirect_uri": redirectUri,
            "client_id": clientID,
            "client_secret": clientSecret
        };

        return lastValueFrom(this.httpService.post(`${streamLabsApiUrl}/token`, params, config));
    }

    public getSocketToken(): Promise<AxiosResponse<Dto.SocketTokenResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return lastValueFrom(this.httpService.get(`${streamLabsApiUrl}/socket/token`, config));
    }

    public getUser(): Promise<AxiosResponse<Dto.UserResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return lastValueFrom(this.httpService.get(`${streamLabsApiUrl}/user`, config));
    }

    public getDonations(): Promise<AxiosResponse<Dto.DonationListResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return lastValueFrom(this.httpService.get(`${streamLabsApiUrl}/donations`, config));
    }

    public createDonation(body: Dto.DonationRequest): Promise<AxiosResponse<Dto.DonationResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return lastValueFrom(this.httpService.post(`${streamLabsApiUrl}/donations`, body, config));
    }

}

export default StreamLabsHttpClient;
