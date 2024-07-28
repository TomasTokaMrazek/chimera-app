import {AxiosResponse} from "../axios";
import {UserView} from "../views";

import {User} from "@prisma/client";
import twitchRepository, {Twitch} from "./repository";

import {AccountIds, OauthTokens} from "./types";

import TwitchHttpClient, {TokenResponse, UserResponse} from "./client/http";

import configuration from "../configuration";

const twitchOauthUrl: string = configuration.twitch.oauthUrl;
const redirectUri: string = configuration.twitch.redirectUrl;
const clientID: string = configuration.twitch.clientId;

class TwitchService {

    private httpClients: Map<number, TwitchHttpClient> = new Map();

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
        const accountIds: AccountIds = await this.getAccountIds(oauthTokens.accessToken);
        await this.setTokens(accountIds, oauthTokens);
        await this.connect(accountIds.twitch.toString());
    }

    public async connect(twitchAccountId: string): Promise<void> {
        const userView: UserView = await twitchRepository.getOrInsertByTwitchId(twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with User.`);
        })();
        const twitchId: number = user.twitch_id ?? ((): number => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with Twitch account.`);
        })();

        const twitch: Twitch = await twitchRepository.getById(twitchId);
        const accessToken: string = twitch.access_token ?? ((): string => {
            throw new Error(`Twitch Account '${twitch.account_id}' does not have Authorization token`);
        })();

        const httpclient: TwitchHttpClient = TwitchHttpClient.createInstance(accessToken);
        this.httpClients.set(user.id, httpclient);
    }

    public getHttpClient(userId: number): TwitchHttpClient {
        return this.httpClients.get(userId) ?? ((): TwitchHttpClient => {
            throw new Error("Twitch HTTP client is undefined.");
        })();
    }

    private async getOauthTokens(authorizationCode: string): Promise<OauthTokens> {
        const httpclient: TwitchHttpClient = TwitchHttpClient.createInstance("");
        const oauthTokensResponse: AxiosResponse<TokenResponse> = await httpclient.getOauthTokens(authorizationCode);
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

    private async getAccountIds(accessToken: string): Promise<AccountIds> {
        const httpclient: TwitchHttpClient = TwitchHttpClient.createInstance(accessToken);
        const userResponse: AxiosResponse<UserResponse> = await httpclient.getOauthUser();
        const twitchAccountId: string = userResponse.data.sub ?? ((): string => {
            throw new Error("Twitch Account ID is undefined.");
        })();

        return {
            twitch: twitchAccountId
        };
    }

    private async setTokens(accountIds: AccountIds, oauthTokens: OauthTokens): Promise<Twitch> {
        const userView: UserView = await twitchRepository.getUser(accountIds.twitch);
        const twitchId: number = userView.user?.twitch_id ?? ((): number => {
            throw new Error("Twitch Account ID is undefined.");
        })();

        return await twitchRepository.updateTokens(twitchId, oauthTokens.accessToken, oauthTokens.refreshToken);
    }

}

export default new TwitchService();
