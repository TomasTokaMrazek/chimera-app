import {Injectable} from "@nestjs/common";
import {HttpService} from "@nestjs/axios";

import {AxiosResponse} from "axios";

import {StreamLabs, Twitch} from "@chimera/prisma/client";

import {TwitchRepository} from "@chimera/twitch/repository/repository";

import {StreamLabsRepository} from "./repository/repository";
import {IdView} from "./repository/views";
import {StreamLabsHttpClient} from "./client/http/client";
import * as HttpDto from "./client/http/dto";

import configuration from "@chimera/configuration";

const streamLabsOauthUrl: string = configuration.streamLabs.oauthUrl;
const redirectUri: string = configuration.streamLabs.redirectUri;
const clientID: string = configuration.streamLabs.clientId;

@Injectable()
export class StreamLabsService {

    constructor(
        private readonly httpService: HttpService,
        private readonly streamLabsRepository: StreamLabsRepository,
        private readonly twitchRepository: TwitchRepository
    ) {}

    private readonly httpClients: Map<string, StreamLabsHttpClient> = new Map();

    async authorize(scope: string): Promise<URL> {
        const scopes: string = scope ?? "donations.read donations.create socket.token";
        const url: URL = new URL(streamLabsOauthUrl + "/authorize");
        url.searchParams.append("response_type", "code");
        url.searchParams.append("client_id", clientID);
        url.searchParams.append("redirect_uri", redirectUri);
        url.searchParams.append("scope", scopes);
        return url;
    }

    async oauthCallback(authorizationCode: string): Promise<void> {
        const httpclientUnauthorized: StreamLabsHttpClient = StreamLabsHttpClient.createInstance(this.httpService, "");
        const oauthTokensResponse: AxiosResponse<HttpDto.TokenResponse> = await httpclientUnauthorized.getOauthTokens(authorizationCode);
        const accessToken: string = oauthTokensResponse.data.access_token ?? ((): string => {
            throw new Error("Access Token is undefined.");
        })();
        const refreshToken: string = oauthTokensResponse.data.refresh_token ?? ((): string => {
            throw new Error("Refresh Token is undefined.");
        })();

        const httpclientAuthorized: StreamLabsHttpClient = StreamLabsHttpClient.createInstance(this.httpService, accessToken);
        const socketTokenResponse: AxiosResponse<HttpDto.SocketTokenResponse> = await httpclientAuthorized.getSocketToken();
        const socketToken: string = socketTokenResponse.data.socket_token ?? ((): string => {
            throw new Error("Socket Token is undefined.");
        })();

        const userResponse: AxiosResponse<HttpDto.UserResponse> = await httpclientAuthorized.getUser();
        const twitchAccountId: string = userResponse.data.twitch.id.toString() ?? ((): string => {
            throw new Error("Twitch Account ID is undefined.");
        })();
        const streamLabsAccountId: string = userResponse.data.streamlabs.id.toString() ?? ((): string => {
            throw new Error("StreamLabs Account ID is undefined.");
        })();

        const twitch: Twitch = await this.twitchRepository.getOrInsertByAccountId(twitchAccountId);
        const streamLabsId: IdView = await this.streamLabsRepository.getOrInsertStreamLabsId(streamLabsAccountId, twitch.id);

        await this.streamLabsRepository.updateTokens(streamLabsId.id, accessToken, refreshToken, socketToken);
    }

    async getHttpClient(id: number): Promise<StreamLabsHttpClient> {
        const streamLabs: StreamLabs = await this.streamLabsRepository.getById(id);
        const accountId: string = streamLabs.account_id ?? ((): string => {
            throw new Error(`StreamLabs Account ID for ID '${id}' does not exist.`);
        })();

        return this.httpClients.get(accountId) ?? ((): StreamLabsHttpClient => {
            throw new Error("StreamLabs HTTP client is undefined.");
        })();
    }

}
