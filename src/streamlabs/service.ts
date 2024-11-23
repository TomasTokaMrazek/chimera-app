import {Injectable} from "@nestjs/common";
import {HttpService} from "@nestjs/axios";

import {AxiosResponse} from "axios";

import {TwitchRepository} from "@chimera/twitch/repository/repository";
import {Twitch, StreamLabs} from "@prisma/client";

import {AccountIds, OauthTokens, SocketToken} from "./types";
import {StreamLabsRepository} from "./repository/repository";
import {IdView} from "./repository/views";

import StreamLabsHttpClient from "./client/http/client";
import * as HttpDto from "./client/http/dto";

import {StreamLabsSocketClientManager} from "@chimera/streamlabs/client/socket/manager";

import configuration from "@chimera/configuration";

const streamLabsOauthUrl: string = configuration.streamLabs.oauthUrl;
const redirectUri: string = configuration.streamLabs.redirectUri;
const clientID: string = configuration.streamLabs.clientId;

@Injectable()
export class StreamLabsService {

    constructor(
        private readonly httpService: HttpService,
        private readonly streamLabsRepository: StreamLabsRepository,
        private readonly streamLabsSocketClientManager: StreamLabsSocketClientManager,
        private readonly twitchRepository: TwitchRepository
    ) {}

    private readonly httpClients: Map<string, StreamLabsHttpClient> = new Map();

    public async login(): Promise<URL> {
        const url: URL = new URL(streamLabsOauthUrl + "/authorize");
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
        await this.connect(accountIds.twitch.toString());
    }

    public async connect(accountId: string): Promise<void> {
        const streamLabs: StreamLabs = await this.streamLabsRepository.getByAccountId(accountId);
        const accessToken: string = streamLabs.access_token ?? ((): string => {
            throw new Error(`StreamLabs Account '${streamLabs.account_id}' does not have Authorization token`);
        })();

        const httpclient: StreamLabsHttpClient = StreamLabsHttpClient.createInstance(this.httpService, accessToken);
        this.httpClients.set(accountId, httpclient);

        await this.streamLabsSocketClientManager.createSocketClient(accountId);
    }

    public async getHttpClient(id: number): Promise<StreamLabsHttpClient> {
        const streamLabs: StreamLabs = await this.streamLabsRepository.getById(id);
        const accountId: string = streamLabs.account_id ?? ((): string => {
            throw new Error(`treamLabs Account ID for ID '${id}' does not exist.`);
        })();

        return this.httpClients.get(accountId) ?? ((): StreamLabsHttpClient => {
            throw new Error("treamLabs HTTP client is undefined.");
        })();
    }

    private async getOauthTokens(authorizationCode: string): Promise<OauthTokens> {
        const httpclient: StreamLabsHttpClient = StreamLabsHttpClient.createInstance(this.httpService, "");
        const oauthTokensResponse: AxiosResponse<HttpDto.TokenResponse> = await httpclient.getOauthTokens(authorizationCode);
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
        const httpclient: StreamLabsHttpClient = StreamLabsHttpClient.createInstance(this.httpService, accessToken);
        const socketTokenResponse: AxiosResponse<HttpDto.SocketTokenResponse> = await httpclient.getSocketToken();
        const socketToken: string = socketTokenResponse.data.socket_token ?? ((): string => {
            throw new Error("Socket Token is undefined.");
        })();

        return {
            socketToken: socketToken
        };
    }

    private async getAccountIds(accessToken: string): Promise<AccountIds> {
        const httpclient: StreamLabsHttpClient = StreamLabsHttpClient.createInstance(this.httpService, accessToken);
        const userResponse: AxiosResponse<HttpDto.UserResponse> = await httpclient.getUser();
        const twitchAccountId: number = userResponse.data.twitch.id ?? ((): string => {
            throw new Error("Twitch Account ID is undefined.");
        })();
        const streamLabsAccountId: number = userResponse.data.streamlabs.id ?? ((): string => {
            throw new Error("StreamLabs Account ID is undefined.");
        })();

        return {
            twitch: twitchAccountId.toString(),
            streamLabs: streamLabsAccountId.toString()
        };
    }

    private async setTokens(accountIds: AccountIds, oauthTokens: OauthTokens, socketToken: SocketToken): Promise<StreamLabs> {
        const twitch: Twitch = await this.twitchRepository.getOrInsertByAccountId(accountIds.twitch);
        const streamLabsId: IdView = await this.streamLabsRepository.getOrCreateStreamLabsId(accountIds.streamLabs, twitch.id);

        return await this.streamLabsRepository.updateTokens(streamLabsId.id, oauthTokens.accessToken, oauthTokens.refreshToken, socketToken.socketToken);
    }

}
