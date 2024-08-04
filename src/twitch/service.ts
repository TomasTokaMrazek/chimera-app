import {AxiosResponse} from "../axios";

import twitchRepository, {Twitch} from "./repository";

import {AccountIds, OauthTokens} from "./types";

import TwitchHttpClient, {TokenResponse, TokenValidationResponse, UserResponse} from "./client/http";

import TTLCache from "@isaacs/ttlcache";
import {CronJob} from "cron";

import configuration from "../configuration";
import {Duration} from "luxon";

const twitchOauthUrl: string = configuration.twitch.oauthUrl;
const redirectUri: string = configuration.twitch.redirectUri;
const clientID: string = configuration.twitch.clientId;

class TwitchService {

    private cronJob: CronJob;

    constructor() {
        this.cronJob = new CronJob("* * 0 * * *", async (): Promise<void> => {
            try {
                console.log("Cron Job - start");
                await Promise.all(Array.from(this.tokenCache.entries()).map(async ([twitchId, accessToken]): Promise<void> => {
                    return await this.validateAccessToken(twitchId, accessToken);
                }));
                console.log("Cron Job - end");
            } catch (e) {
                console.error(e);
            }
        }, null, true);
    }

    private tokenCache: TTLCache<number, string> = new TTLCache({
        ttl: Duration.fromObject({days: 1}).milliseconds,
        updateAgeOnGet: true
    });

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
        const twitch: Twitch = await twitchRepository.getOrInsertByAccountId(accountIds.twitch);
        await twitchRepository.updateTokens(twitch.id, oauthTokens.accessToken, oauthTokens.refreshToken);
    }

    public async getHttpClient(twitchId: number): Promise<TwitchHttpClient> {
        const accessToken: string = this.tokenCache.get(twitchId) ?? await (async (): Promise<string> => {
            const twitch: Twitch = await twitchRepository.getById(twitchId)
            const newAccessToken = twitch.access_token ?? ((): string => {
                throw new Error(`Twitch ID '${twitchId}' does not have Access Token.`);
            })();
            this.tokenCache.set(twitchId, newAccessToken);
            return newAccessToken;
        })();
        return TwitchHttpClient.createInstance(accessToken);
    }

    private async getOauthTokens(authorizationCode: string): Promise<OauthTokens> {
        const httpClient: TwitchHttpClient = TwitchHttpClient.createInstance("");
        const oauthTokensResponse: AxiosResponse<TokenResponse> = await httpClient.getOauthTokenByCode(authorizationCode);
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
        const userResponse: AxiosResponse<UserResponse> = await httpClient.getOauthUser();
        const twitchAccountId: string = userResponse.data.sub ?? ((): string => {
            throw new Error("Twitch Account ID is undefined.");
        })();

        return {
            twitch: twitchAccountId
        };
    }

    private async validateAccessToken(twitchId: number, accessToken: string): Promise<void> {
        const httpClient: TwitchHttpClient = TwitchHttpClient.createInstance(accessToken);
        const validationResponse: AxiosResponse<TokenValidationResponse> = await httpClient.getOauthTokenValidation();
        if (validationResponse.status !== 200 || validationResponse.data.expires_in < 7200) {
            const twitch: Twitch = await twitchRepository.getById(twitchId);
            const refreshToken: string = twitch.refresh_token ?? ((): string => {
                throw new Error(`Twitch ID '${twitchId}' does not have Refresh Token.`);
            })();
            const refreshResponse: AxiosResponse<TokenResponse> = await httpClient.getOauthTokenByRefresh(refreshToken);
            if (refreshResponse.status !== 200) {
                await twitchRepository.updateTokens(twitchId);
                this.tokenCache.delete(twitchId);
            } else {
                const newAccessToken: string = refreshResponse.data.access_token;
                const newRefreshToken: string = refreshResponse.data.refresh_token;
                await twitchRepository.updateTokens(twitchId, accessToken, newRefreshToken);
                this.tokenCache.set(twitchId, newAccessToken);
            }
        }
    }

}

export default new TwitchService();
