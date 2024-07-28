import {AxiosResponse} from "../axios";
import {UserView} from "../views";

import {User} from "@prisma/client";
import twitchRepository, {Twitch} from "./repository";

import {AccountIds, OauthTokens} from "./types";

import TwitchHttpClient, {TokenResponse, TokenValidationResponse, UserResponse} from "./client/http";

import {CronJob} from "cron";

import configuration from "../configuration";

const twitchOauthUrl: string = configuration.twitch.oauthUrl;
const redirectUri: string = configuration.twitch.redirectUrl;
const clientID: string = configuration.twitch.clientId;

class TwitchService {

    private cronJob: CronJob;

    constructor() {
        this.cronJob = new CronJob("* 0 * * * *", async (): Promise<void> => {
            try {
                console.log("Cron Job - start");
                await Promise.all(Array.from(this.httpClients.keys()).map(async (twitchId): Promise<void> => {
                    return await this.validateAccessToken(twitchId);
                }));
                console.log("Cron Job - end");
            } catch (e) {
                console.error(e);
            }
        }, null, true);
    }

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
        const accessToken: string = oauthTokens.accessToken ?? ((): string => {
            throw new Error(`Twitch Account Access Token is undefined.`);
        })();
        const accountIds: AccountIds = await this.getAccountIds(accessToken);
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
        this.httpClients.set(twitchId, httpclient);

        await this.validateAccessToken(twitchId);
    }

    public getHttpClient(userId: number): TwitchHttpClient {
        return this.httpClients.get(userId) ?? ((): TwitchHttpClient => {
            throw new Error("Twitch HTTP client is undefined.");
        })();
    }

    private async getOauthTokens(authorizationCode: string): Promise<OauthTokens> {
        const httpClient: TwitchHttpClient = TwitchHttpClient.createInstance("");
        const oauthTokensResponse: AxiosResponse<TokenResponse> = await httpClient.getOauthTokenByCode(authorizationCode);
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
        const httpClient: TwitchHttpClient = TwitchHttpClient.createInstance(accessToken);
        const userResponse: AxiosResponse<UserResponse> = await httpClient.getOauthUser();
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

    private async validateAccessToken(twitchId: number): Promise<void> {
        const httpClient = this.httpClients.get(twitchId) ?? ((): TwitchHttpClient => {
            throw new Error(`Twitch ID '${twitchId}' does not have http client instance.`);
        })();
        const validationResponse: AxiosResponse<TokenValidationResponse> = await httpClient.getOauthTokenValidation();
        if (validationResponse.status !== 200 || validationResponse.data.expires_in < 7200) {
            const twitch: Twitch = await twitchRepository.getById(twitchId);
            const accountIds: AccountIds = {
                twitch: twitch.account_id
            }
            const refreshToken: string = twitch.refresh_token ?? ((): string => {
                throw new Error(`Twitch ID '${twitch.id}' does not have Refresh Token`);
            })();
            const refreshResponse: AxiosResponse<TokenResponse> = await httpClient.getOauthTokenByRefresh(refreshToken);
            if (refreshResponse.status !== 200) {
                const newOauthTokens: OauthTokens = {};
                await this.setTokens(accountIds, newOauthTokens);
                this.httpClients.delete(twitchId);
            } else {
                const newAccessToken: string = refreshResponse.data.access_token;
                const newRefreshToken: string = refreshResponse.data.refresh_token;
                const newOauthTokens: OauthTokens = {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                };
                await this.setTokens(accountIds, newOauthTokens);
                this.httpClients.set(twitchId, TwitchHttpClient.createInstance(newAccessToken));
            }
        }
    }

}

export default new TwitchService();
