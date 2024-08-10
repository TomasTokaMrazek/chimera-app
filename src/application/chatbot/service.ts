import {AxiosResponse} from "@chimera/axios";
import {Twitch} from "@prisma/client";

import twitchRepository from "@chimera/twitch/repository/repository";
import {IdView} from "@chimera/twitch/repository/views";

import TwitchHttpClient from "@chimera/twitch/client/http/client";
import * as TokenDto from "@chimera/twitch/client/http/dto/token";

import twitchSocketClientManager from "@chimera/twitch/client/socket/manager";

import {AccountIds, OauthTokens} from "./types";

import configuration from "@chimera/configuration";

const twitchWebsocketUrl: string = configuration.twitch.websocketUrl;
const twitchOauthUrl: string = configuration.twitch.oauthUrl;
const clientID: string = configuration.twitch.clientId;
const redirectUri: string = configuration.app.chatbot.redirectUri;
const userAccountId: string = configuration.app.chatbot.userAccountId;

class ChatbotService {

    public async login(): Promise<URL> {
        const url: URL = new URL(twitchOauthUrl + "/authorize");
        url.searchParams.append("response_type", "code");
        url.searchParams.append("client_id", clientID);
        url.searchParams.append("redirect_uri", redirectUri);
        url.searchParams.append("scope", "user:read:chat user:write:chat");
        return url;
    }

    public async oauthCallback(authorizationCode: string): Promise<void> {
        const oauthTokens: OauthTokens = await this.getOauthTokens(authorizationCode);
        const accessToken: string = oauthTokens.accessToken ?? ((): string => {
            throw new Error(`Twitch Account Access Token is undefined.`);
        })();
        const accountIds: AccountIds = await this.getAccountIds(accessToken);
        if (accountIds.twitch !== userAccountId) {
            throw new Error(`Twitch Account not allowed.`);
        }
        const twitch: Twitch = await twitchRepository.getOrInsertByAccountId(accountIds.twitch);
        await twitchRepository.updateTokens(twitch.id, oauthTokens.accessToken, oauthTokens.refreshToken);
    }

    public async connect(): Promise<void> {
        const idView: IdView = await twitchRepository.getIdByAccountId(userAccountId);
        await twitchSocketClientManager.connectClient(idView.id, twitchWebsocketUrl);
    }

    public async disconnect(): Promise<void> {
        const idView: IdView = await twitchRepository.getIdByAccountId(userAccountId);
        return twitchSocketClientManager.disconnectClient(idView.id);
    }

    private async getOauthTokens(authorizationCode: string): Promise<OauthTokens> {
        const httpClient: TwitchHttpClient = TwitchHttpClient.createInstance("");
        const oauthTokensResponse: AxiosResponse<TokenDto.TokenCodeResponseBody> = await httpClient.getOauthTokenByCode(authorizationCode);
        const accessToken: string = oauthTokensResponse.data.access_token ?? ((): string => {
            throw new Error("Twitch Access Token is undefined.");
        })();
        const refreshToken: string = oauthTokensResponse.data.refresh_token ?? ((): string => {
            throw new Error("Twitch Refresh Token is undefined.");
        })();

        return {
            accessToken: accessToken,
            refreshToken: refreshToken
        };
    }

    private async getAccountIds(accessToken: string): Promise<AccountIds> {
        const httpClient: TwitchHttpClient = TwitchHttpClient.createInstance(accessToken);
        const userResponse: AxiosResponse<TokenDto.UserInfoResponseBody> = await httpClient.getOauthUser();
        const twitchAccountId: string = userResponse.data.sub ?? ((): string => {
            throw new Error("Twitch Account ID is undefined.");
        })();

        return {
            twitch: twitchAccountId
        };
    }

}

export default new ChatbotService();
