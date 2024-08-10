import TTLCache from "@isaacs/ttlcache";
import {CronJob} from "cron";
import {Duration} from "luxon";

import {AxiosResponse} from "@chimera/axios";
import {Twitch} from "@prisma/client";

import twitchRepository from "@chimera/twitch/repository/repository";

import TwitchHttpClient from "./client";
import * as Token from "./dto/token";

class TwitchHttpClientManager {

    private cronJob: CronJob = new CronJob("0 0 * * * *", async (): Promise<void> => {
        try {
            console.log("Cron Job - start");
            await Promise.all(Array.from(this.tokenCache.entries()).map(async ([twitchId, accessToken]: [number, string]): Promise<void> => {
                return await this.validateAccessToken(twitchId, accessToken);
            }));
            console.log("Cron Job - end");
        } catch (e) {
            console.error(e);
        }
    }, null, true);

    private tokenCache: TTLCache<number, string> = new TTLCache({
        ttl: Duration.fromObject({days: 1}).as("milliseconds"),
        updateAgeOnGet: true
    });

    public async getHttpClient(twitchId: number): Promise<TwitchHttpClient> {
        const accessToken: string = this.tokenCache.get(twitchId) ?? await (async (): Promise<string> => {
            const twitch: Twitch = await twitchRepository.getById(twitchId)
            return twitch.access_token ?? ((): string => {
                throw new Error(`Twitch ID '${twitchId}' does not have Access Token.`);
            })();
        })();
        this.tokenCache.set(twitchId, accessToken);
        await this.validateAccessToken(twitchId, accessToken);
        const newAccessToken: string = this.tokenCache.get(twitchId) ?? ((): string => {
            throw new Error(`Twitch ID '${twitchId}' does not have Access Token.`);
        })();
        return TwitchHttpClient.createInstance(newAccessToken);
    }

    private async validateAccessToken(twitchId: number, accessToken: string): Promise<void> {
        const httpClient: TwitchHttpClient = TwitchHttpClient.createInstance(accessToken);
        const validationResponse: AxiosResponse<Token.TokenValidationResponseBody> = await httpClient.getOauthTokenValidation();
        if (validationResponse.status !== 200 || validationResponse.data.expires_in < 7200) {
            const twitch: Twitch = await twitchRepository.getById(twitchId);
            const refreshToken: string = twitch.refresh_token ?? ((): string => {
                throw new Error(`Twitch ID '${twitchId}' does not have Refresh Token.`);
            })();
            const refreshResponse: AxiosResponse<Token.TokenRefreshResponseBody> = await httpClient.getOauthTokenByRefresh(refreshToken);
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

export default new TwitchHttpClientManager();
