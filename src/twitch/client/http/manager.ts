import {Injectable, Logger} from "@nestjs/common";
import {Cron} from "@nestjs/schedule";
import {HttpService} from "@nestjs/axios";

import TTLCache from "@isaacs/ttlcache";
import {hoursToSeconds} from "date-fns";

import {AxiosResponse} from "axios";
import {Twitch} from "@prisma/client";

import {TwitchRepository} from "@chimera/twitch/repository/repository";

import TwitchHttpClient from "./client";
import * as Token from "./dto/token";


@Injectable()
export class TwitchHttpClientManager {

    constructor(
        private readonly httpService: HttpService,
        private readonly twitchRepository: TwitchRepository
    ) {}

    private readonly logger: Logger = new Logger(TwitchHttpClientManager.name);

    private readonly tokenCache: TTLCache<number, string> = new TTLCache({
        ttl: hoursToSeconds(24),
        updateAgeOnGet: true
    });

    @Cron("0 0 * * * *")
    private async validateClients() {
        this.logger.log("Cron Job - start");
        await Promise.all(Array.from(this.tokenCache.entries()).map(async ([twitchId, accessToken]: [number, string]): Promise<void> => {
            return await this.validateAccessToken(twitchId, accessToken);
        }));
        this.logger.log("Cron Job - end");
    }

    public async getHttpClient(twitchId: number): Promise<TwitchHttpClient> {
        const accessToken: string = this.tokenCache.get(twitchId) ?? await (async (): Promise<string> => {
            const twitch: Twitch = await this.twitchRepository.getById(twitchId);
            return twitch.access_token ?? ((): string => {
                throw new Error(`Twitch ID '${twitchId}' does not have Access Token.`);
            })();
        })();
        this.tokenCache.set(twitchId, accessToken);
        await this.validateAccessToken(twitchId, accessToken);
        const newAccessToken: string = this.tokenCache.get(twitchId) ?? ((): string => {
            throw new Error(`Twitch ID '${twitchId}' does not have Access Token.`);
        })();
        return TwitchHttpClient.createInstance(this.httpService, newAccessToken);
    }

    private async validateAccessToken(twitchId: number, accessToken: string): Promise<void> {
        const httpClient: TwitchHttpClient = TwitchHttpClient.createInstance(this.httpService, accessToken);
        const validationResponse: AxiosResponse<Token.TokenValidationResponseBody> = await httpClient.getOauthTokenValidation();
        if (validationResponse.status !== 200 || validationResponse.data.expires_in < 7200) {
            const twitch: Twitch = await this.twitchRepository.getById(twitchId);
            const refreshToken: string = twitch.refresh_token ?? ((): string => {
                throw new Error(`Twitch ID '${twitchId}' does not have Refresh Token.`);
            })();
            const refreshResponse: AxiosResponse<Token.TokenRefreshResponseBody> = await httpClient.getOauthTokenByRefresh(refreshToken);
            if (refreshResponse.status !== 200) {
                await this.twitchRepository.updateTokens(twitchId);
                this.tokenCache.delete(twitchId);
            } else {
                const newAccessToken: string = refreshResponse.data.access_token;
                const newRefreshToken: string = refreshResponse.data.refresh_token;
                await this.twitchRepository.updateTokens(twitchId, accessToken, newRefreshToken);
                this.tokenCache.set(twitchId, newAccessToken);
            }
        }
    }

}
