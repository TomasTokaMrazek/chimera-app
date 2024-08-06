import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../../../axios";

import * as EventSub from "./dto/eventsub";
import * as Token from "./dto/token";

import configuration from "../../../configuration";

const twitchApiUrl: string = configuration.twitch.apiUrl;
const twitchOauthUrl: string = configuration.twitch.oauthUrl;
const redirectUri: string = configuration.twitch.redirectUri;
const clientID: string = configuration.twitch.clientId;
const clientSecret: string = configuration.twitch.clientSecret;

class TwitchHttpClient {

    private constructor(
        private readonly accessToken: string
    ) {}

    static createInstance(accessToken: string): TwitchHttpClient {
        return new TwitchHttpClient(accessToken);
    }

    public getOauthTokenByCode(authorizationCode: string): Promise<AxiosResponse<Token.TokenCodeResponseBody>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const body: Token.TokenCodeRequestBody = {
            "grant_type": "authorization_code",
            "code": authorizationCode,
            "redirect_uri": redirectUri,
            "client_id": clientID,
            "client_secret": clientSecret
        };

        return axiosInstance.post(`${twitchOauthUrl}/token`, body, config);
    }

    public getOauthTokenByRefresh(refreshToken: string): Promise<AxiosResponse<Token.TokenRefreshResponseBody>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const data: Token.TokenRefreshRequestBody = {
            "grant_type": "refresh_token",
            "refresh_token": refreshToken,
            "client_id": clientID,
            "client_secret": clientSecret
        };

        return axiosInstance.post(`${twitchOauthUrl}/token`, data, config);
    }

    public getOauthTokenValidation(): Promise<AxiosResponse<Token.TokenValidationResponseBody>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return axiosInstance.get(`${twitchOauthUrl}/validate`, config);
    }

    public getOauthUser(): Promise<AxiosResponse<Token.UserInfoResponseBody>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return axiosInstance.get(`${twitchOauthUrl}/userinfo`, config);
    }

    public createEventSubSubscription(body: EventSub.CreateEventSubSubscriptionRequestBody): Promise<AxiosResponse<EventSub.CreateEventSubSubscriptionResponseBody>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Client-Id": clientID
            }
        };

        return axiosInstance.post(`${twitchApiUrl}/eventsub/subscriptions`, body, config);
    }

    public deleteEventSubSubscription(params: EventSub.DeleteEventSubSubscriptionRequestParams): Promise<AxiosResponse<void>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Client-Id": clientID
            },
            params: params
        };

        return axiosInstance.delete(`${twitchApiUrl}/eventsub/subscriptions`, config);
    }

    public getEventSubSubscription(params: EventSub.GetEventSubSubscriptionRequestParams): Promise<AxiosResponse<EventSub.GetEventSubSubscriptionResponseBody>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Client-Id": clientID
            },
            params: params
        };

        return axiosInstance.get(`${twitchApiUrl}/eventsub/subscriptions`, config);
    }

}

export default TwitchHttpClient;
