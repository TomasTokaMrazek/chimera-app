import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../axios";
import {IdView, UserView} from "../views";

import streamLabsRepository, {StreamLabs} from "./repository";
import twitchRepository from "../twitch/repository";

import {AccountIds, OauthTokens, SocketToken} from "./types";
import streamLabsSocketClient from "./socket";

import configuration from "../configuration";
import {User} from "@prisma/client";

const streamLabsApiUrl: string = configuration.streamLabs.apiUrl;
const redirectUri: string = configuration.streamLabs.redirectUrl;
const clientID: string = configuration.streamLabs.clientId;
const clientSecret: string = configuration.streamLabs.clientSecret;

class StreamLabsService {

    public async login(): Promise<URL> {
        const url: URL = new URL(streamLabsApiUrl + "/authorize");
        url.searchParams.append("response_type", "code");
        url.searchParams.append("client_id", clientID);
        url.searchParams.append("redirect_uri", redirectUri);
        url.searchParams.append("scope", "donations.read donations.create socket.token");
        return url;
    }

    public async oauthCallback(authorizationCode: string): Promise<void> {
        const oauthTokens: OauthTokens = await this.getOauthTokens(authorizationCode);
        const socketToken: SocketToken = await this.getSocketToken(oauthTokens.accessToken);
        const accountIds: AccountIds = await this.getAccountIds(oauthTokens.accessToken);

        await this.setTokens(accountIds, oauthTokens, socketToken);

        await streamLabsSocketClient.openSocket(socketToken.socketToken);
    }

    public async connect(twitchAccountId: string): Promise<void> {
        const userView: UserView = await twitchRepository.getUser(twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with User.`);
        })();
        const streamLabsId: number = user.streamlabs_id ?? ((): number => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with StreamLabs account.`);
        })();

        const streamLabs: StreamLabs = await streamLabsRepository.getById(streamLabsId);
        const socketToken: string = streamLabs.socket_token ?? ((): string => {
            throw new Error(`StreamLabs Account '${streamLabs.account_id}' is not associated with StreamLabs account.`);
        })();

        await streamLabsSocketClient.openSocket(socketToken);
    }

    private async getOauthTokens(authorizationCode: string): Promise<OauthTokens> {
        const tokenData: {} = {
            "grant_type": "authorization_code",
            "code": authorizationCode,
            "redirect_uri": redirectUri,
            "client_id": clientID,
            "client_secret": clientSecret
        };

        const tokenConfig: AxiosRequestConfig = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const oauthTokensResponse: AxiosResponse<any, any> = await axiosInstance.post(streamLabsApiUrl + "/token", tokenData, tokenConfig);
        const accessToken: string = oauthTokensResponse.data.access_token ?? ((): string => {
            throw new Error("Access Token is undefined.");
        })();
        const refreshToken: string = oauthTokensResponse.data.refresh_token ?? ((): string => {
            throw new Error("Refresh Token is undefined.");
        })();

        return {
            accessToken: accessToken,
            refreshToken: refreshToken
        };
    }

    private async getSocketToken(accessToken: string): Promise<SocketToken> {
        const config: {} = {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        };

        const socketTokenResponse: AxiosResponse<any, any> = await axiosInstance.get(streamLabsApiUrl + "/socket/token", config);
        const socketToken: string = socketTokenResponse.data.socket_token ?? ((): string => {
            throw new Error("Socket Token is undefined.");
        })();

        return {
            socketToken: socketToken
        };
    }

    private async getAccountIds(accessToken: string): Promise<AccountIds> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        };

        const userResponse: AxiosResponse<any, any> = await axiosInstance.get(streamLabsApiUrl + "/user", config);
        const twitchAccountId: string = userResponse.data.twitch.id ?? ((): string => {
            throw new Error("Twitch Account ID is undefined.");
        })();
        const streamLabsAccountId: string = userResponse.data.streamlabs.id ?? ((): string => {
            throw new Error("StreamLabs Account ID is undefined.");
        })();

        return {
            twitch: twitchAccountId,
            streamLabs: streamLabsAccountId
        };
    }

    private async setTokens(accountIds: AccountIds, oauthTokens: OauthTokens, socketToken: SocketToken): Promise<StreamLabs> {
        const twitchId: IdView = await twitchRepository.getOrInsertTwitchId(accountIds.twitch);
        const streamLabsId: IdView = await streamLabsRepository.getOrCreateStreamLabsId(accountIds.streamLabs, twitchId.id);

        return await streamLabsRepository.updateTokens(streamLabsId.id, oauthTokens.accessToken, oauthTokens.refreshToken, socketToken.socketToken);
    }

}

export default new StreamLabsService();
