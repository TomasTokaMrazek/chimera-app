import {HttpService} from "@nestjs/axios";

import {AxiosRequestConfig, AxiosResponse} from "axios";
import {lastValueFrom} from "rxjs";

import * as Token from "./dto/token";
import * as EventSub from "./dto/eventsub";
import * as User from "./dto/user";
import * as Chat from "./dto/chat";

import configuration from "@chimera/configuration";

const twitchApiUrl: string = configuration.twitch.apiUrl;
const twitchOauthUrl: string = configuration.twitch.oauthUrl;
const redirectUri: string = configuration.twitch.redirectUri;
const clientID: string = configuration.twitch.clientId;
const clientSecret: string = configuration.twitch.clientSecret;

class TwitchHttpClient {

    private constructor(
        private readonly httpService: HttpService,
        private readonly accessToken: string
    ) {}

    static createInstance(httpService: HttpService, accessToken: string): TwitchHttpClient {
        return new TwitchHttpClient(httpService, accessToken);
    }

    public async getOauthTokenByCode(authorizationCode: string): Promise<AxiosResponse<Token.TokenCodeResponseBody>> {
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

        return lastValueFrom(this.httpService.post(`${twitchOauthUrl}/token`, body, config));
    }

    public async getOauthTokenByRefresh(refreshToken: string): Promise<AxiosResponse<Token.TokenRefreshResponseBody>> {
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

        return lastValueFrom(this.httpService.post(`${twitchOauthUrl}/token`, data, config));
    }

    public async getOauthTokenValidation(): Promise<AxiosResponse<Token.TokenValidationResponseBody>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return lastValueFrom(this.httpService.get(`${twitchOauthUrl}/validate`, config));
    }

    public async getOauthUser(): Promise<AxiosResponse<Token.UserInfoResponseBody>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return lastValueFrom(this.httpService.get(`${twitchOauthUrl}/userinfo`, config));
    }

    public async createEventSubSubscription(body: EventSub.CreateEventSubSubscriptionRequestBody): Promise<AxiosResponse<EventSub.CreateEventSubSubscriptionResponseBody>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Client-Id": clientID
            }
        };

        return lastValueFrom(this.httpService.post(`${twitchApiUrl}/eventsub/subscriptions`, body, config));
    }

    public async deleteEventSubSubscription(params: EventSub.DeleteEventSubSubscriptionRequestParams): Promise<AxiosResponse<void>> {
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

        return lastValueFrom(this.httpService.delete(`${twitchApiUrl}/eventsub/subscriptions`, config));
    }

    public async getEventSubSubscription(params: EventSub.GetEventSubSubscriptionRequestParams): Promise<AxiosResponse<EventSub.GetEventSubSubscriptionResponseBody>> {
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

        return lastValueFrom(this.httpService.get(`${twitchApiUrl}/eventsub/subscriptions`, config));
    }

    public async getUsers(params: User.GetUsersRequestParams): Promise<AxiosResponse<User.GetUsersResponseBody>> {
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

        return lastValueFrom(this.httpService.get(`${twitchApiUrl}/users`, config));
    }

    public async getUsersChatColor(params: Chat.GetUsersChatColorRequestParams): Promise<AxiosResponse<Chat.GetUsersChatColorResponseBody>> {
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

        return lastValueFrom(this.httpService.get(`${twitchApiUrl}/chat/color`, config));
    }

    public async sentChatMessage(body: Chat.SendChatMessageRequestBody): Promise<AxiosResponse<Chat.SendChatMessageResponseBody>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Authorization": `Bearer ${this.accessToken}`,
                "Client-Id": clientID
            }
        };

        return lastValueFrom(this.httpService.post(`${twitchApiUrl}/chat/messages`, body, config));
    }

}

export default TwitchHttpClient;
