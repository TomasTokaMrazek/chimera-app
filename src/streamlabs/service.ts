import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../axios";
import {IdView} from "../views";

import streamLabsRepository, {StreamLabs} from "./repository";
import twitchRepository from "../twitch/repository";

import {AccountIds, OauthTokens, SocketToken} from "./types";
import streamLabsSocketClient from "./socket";

import configuration from "../configuration";

const streamLabsApi: string = configuration.streamLabs.apiUrl;
const redirectUri: string = configuration.streamLabs.redirectUrl;
const clientID: string = configuration.streamLabs.clientId;
const clientSecret: string = configuration.streamLabs.clientSecret;

class StreamLabsService {

    public async getOauthTokens(authorizationCode: string): Promise<OauthTokens> {
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

        const oauthTokensResponse: AxiosResponse<any, any> = await axiosInstance.post(streamLabsApi + "/token", tokenData, tokenConfig);
        const accessToken: string = String(oauthTokensResponse.data.access_token) ?? ((): void => {
            throw new Error("Access Token is undefined.");
        });
        const refreshToken: string = String(oauthTokensResponse.data.refresh_token) ?? ((): void => {
            throw new Error("Refresh Token is undefined.");
        });

        return {
            accessToken: accessToken,
            refreshToken: refreshToken
        };
    }

    public async getSocketToken(accessToken: string): Promise<SocketToken> {
        const config: {} = {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        };

        const socketTokenResponse: AxiosResponse<any, any> = await axiosInstance.get(streamLabsApi + "/socket/token", config);
        const socketToken: string = String(socketTokenResponse.data.socket_token) ?? ((): void => {
            throw new Error("Socket Token is undefined.");
        });

        return {
            socketToken: socketToken
        };
    }

    public async getAccountIds(accessToken: string): Promise<AccountIds> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        };

        const userResponse: AxiosResponse<any, any> = await axiosInstance.get(streamLabsApi + "/user", config);
        const twitchAccountId: string = String(userResponse.data.twitch.id) ?? ((): void => {
            throw new Error("Twitch Account ID is undefined.");
        });
        const streamLabsAccountId: string = String(userResponse.data.streamlabs.id) ?? ((): void => {
            throw new Error("StreamLabs Account ID is undefined.");
        });

        return {
            twitch: twitchAccountId,
            streamLabs: streamLabsAccountId
        };
    }

    public async setTokens(accountIds: AccountIds, oauthTokens: OauthTokens, socketToken: SocketToken): Promise<StreamLabs> {
        const twitchId: IdView = await twitchRepository.getOrInsertTwitchId(accountIds.twitch);
        const streamLabsId: IdView = await streamLabsRepository.getOrCreateStreamLabsId(accountIds.streamLabs, twitchId.id);

        return await streamLabsRepository.updateTokens(streamLabsId.id, oauthTokens.accessToken, oauthTokens.refreshToken, socketToken.socketToken);
    }

    public async connectToWebSocket(socketToken: string) {
        return await streamLabsSocketClient.openSocket(socketToken);
    }

}

export default new StreamLabsService();
