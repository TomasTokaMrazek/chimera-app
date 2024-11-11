import {Injectable} from '@nestjs/common';

import {AxiosResponse} from "@chimera/axios";
import {Twitch} from "@prisma/client";

import {TwitchRepository} from "@chimera/twitch/repository/repository";

import {AccountIds, OauthTokens} from "./types";
import TwitchHttpClient from "./client/http/client";
import * as Token from "./client/http/dto/token";

import configuration from "@chimera/configuration";

const twitchOauthUrl: string = configuration.twitch.oauthUrl;
const redirectUri: string = configuration.twitch.redirectUri;
const clientID: string = configuration.twitch.clientId;

@Injectable()
export class TwitchService {

    constructor(
        private readonly twitchRepository: TwitchRepository
    ) {}

    public async login(): Promise<URL> {
        const url: URL = new URL(twitchOauthUrl + "/authorize");
        url.searchParams.append("response_type", "code");
        url.searchParams.append("client_id", clientID);
        url.searchParams.append("redirect_uri", redirectUri);
        url.searchParams.append("scope", "");
        return url;
    }

    public async oauthCallback(authorizationCode: string): Promise<void> {
        const oauthTokens: OauthTokens = await this.getOauthTokens(authorizationCode);
        const accessToken: string = oauthTokens.accessToken ?? ((): string => {
            throw new Error(`Twitch Account Access Token is undefined.`);
        })();
        const accountIds: AccountIds = await this.getAccountIds(accessToken);
        const twitch: Twitch = await this.twitchRepository.getOrInsertByAccountId(accountIds.twitch);
        await this.twitchRepository.updateTokens(twitch.id, oauthTokens.accessToken, oauthTokens.refreshToken);
    }

    private async getOauthTokens(authorizationCode: string): Promise<OauthTokens> {
        const httpClient: TwitchHttpClient = TwitchHttpClient.createInstance("");
        const oauthTokensResponse: AxiosResponse<Token.TokenCodeResponseBody> = await httpClient.getOauthTokenByCode(authorizationCode);
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
        const userResponse: AxiosResponse<Token.UserInfoResponseBody> = await httpClient.getOauthUser();
        const twitchAccountId: string = userResponse.data.sub ?? ((): string => {
            throw new Error("Twitch Account ID is undefined.");
        })();

        return {
            twitch: twitchAccountId
        };
    }

}
