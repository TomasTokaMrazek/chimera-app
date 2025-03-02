import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from "@nestjs/common";

import {AccessToken, RefreshingAuthProvider} from "@twurple/auth";
import {ApiClient} from "@twurple/api";
import {EventSubWsListener} from "@twurple/eventsub-ws";
import {LogLevel} from "@d-fischer/logger";
import {LoggerOverride} from "@d-fischer/logger/lib/CustomLoggerWrapper";

import {Twitch} from "@chimera/prisma/client";

import {TwitchRepository} from "./repository/repository";

import configuration, {getEnvVariable} from "@chimera/configuration";
import {WebhookClient} from "discord.js";

const twitchOauthUrl: string = configuration.twitch.oauthUrl;
const redirectUri: string = configuration.twitch.redirectUri;
const clientId: string = configuration.twitch.clientId;
const clientSecret: string = configuration.twitch.clientSecret;

const discordWebhookUrl: string = getEnvVariable("DISCORD_NOTIFICATION_WEBHOOK_URL");

@Injectable()
export class TwitchService implements OnModuleInit, OnModuleDestroy {

    private readonly logger: Logger = new Logger(TwitchService.name);

    private readonly twitchLogger: LoggerOverride = {
        log: (level: LogLevel, message: string): void => {
            // Empty
        },
        crit: (message: string): void => {
            this.logger.fatal(message);
        },
        error: (message: string): void => {
            this.logger.error(message);
        },
        warn: (message: string): void => {
            this.logger.warn(message);
        },
        info: (message: string): void => {
            this.logger.log(message);
        },
        debug: (message: string): void => {
            this.logger.debug(message);
        },
        trace: (message: string): void => {
            this.logger.verbose(message);
        },
    };

    private readonly authProvider: RefreshingAuthProvider = new RefreshingAuthProvider({
        clientId: clientId,
        clientSecret: clientSecret,
        redirectUri: redirectUri
    });

    private readonly apiClient: ApiClient = new ApiClient({
        authProvider: this.authProvider,
        logger: {
            custom: this.twitchLogger
        }
    });

    private readonly eventSubWsListener: EventSubWsListener = new EventSubWsListener({
        apiClient: this.apiClient,
        logger: {
            custom: this.twitchLogger
        }
    });

    constructor(
        private readonly twitchRepository: TwitchRepository
    ) {}

    async onModuleInit(): Promise<any> {
        const webhookClient = new WebhookClient({
            url: discordWebhookUrl
        });

        this.authProvider.onRefresh(async (accountId: string, token: AccessToken): Promise<any> => {
            await webhookClient.send({
                content: `Refresh token for account: ${accountId}.`
            });
            await this.twitchRepository.updateTokens(accountId, token.accessToken, token.refreshToken, token.expiresIn, token.obtainmentTimestamp);
        });

        this.authProvider.onRefreshFailure(async (accountId: string, error: Error): Promise<any> => {
            await webhookClient.send({
                content: `Refresh token failure for account: ${accountId}. Error: ${error.message}`
            });
            await this.authProvider.refreshAccessTokenForUser(accountId);
        });

        this.eventSubWsListener.start();
    }

    async onModuleDestroy(): Promise<any> {
        this.eventSubWsListener.stop();
    }

    async authorize(scope: string): Promise<URL> {
        const scopes: string = scope ?? "channel:manage:redemptions channel:read:vips channel:read:subscriptions moderation:read moderator:read:followers moderator:read:chatters";
        const url: URL = new URL(twitchOauthUrl + "/authorize");
        url.searchParams.append("response_type", "code");
        url.searchParams.append("client_id", clientId);
        url.searchParams.append("redirect_uri", redirectUri);
        url.searchParams.append("scope", scopes);
        return url;
    }

    async oauthCallback(authorizationCode: string): Promise<void> {
        const accountId: string = await this.authProvider.addUserForCode(authorizationCode);
        await this.twitchRepository.getOrInsertByAccountId(accountId);
        await this.authProvider.refreshAccessTokenForUser(accountId);
    }

    async login(accountId: string): Promise<void> {
        const twitch: Twitch = await this.twitchRepository.getByAccountId(accountId);
        const accessToken: string = twitch.access_token ?? ((): string => {
            throw new Error(`Twitch Account ID '${accountId}' does not have Access Token.`);
        })();
        const refreshToken: string = twitch.refresh_token ?? ((): string => {
            throw new Error(`Twitch Account ID '${accountId}' does not have Refresh Token.`);
        })();
        await this.authProvider.addUserForToken({
            accessToken: accessToken,
            refreshToken: refreshToken,
            obtainmentTimestamp: 0,
            expiresIn: 0
        })
    }

    async getApiClient(): Promise<ApiClient> {
        return this.apiClient;
    }

    async getEventSubWsListener(): Promise<EventSubWsListener> {
        return this.eventSubWsListener;
    }

}
