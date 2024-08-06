import {AxiosResponse} from "../axios";
import {IdView, UserView} from "../views";

import {Twitch, User} from "@prisma/client";
import streamLabsRepository, {StreamLabs} from "./repository";
import twitchRepository from "../twitch/repository";

import {AccountIds, OauthTokens, SocketToken} from "./types";

import StreamLabsHttpClient, {SocketTokenResponse, TokenResponse, UserResponse} from "./client/http";
import StreamLabsSocketClient from "./client/socket";

import configuration from "../configuration";

const streamLabsOauthUrl: string = configuration.streamLabs.oauthUrl;
const redirectUri: string = configuration.streamLabs.redirectUri;
const clientID: string = configuration.streamLabs.clientId;

class StreamLabsService {

    private httpClients: Map<number, StreamLabsHttpClient> = new Map();
    private socketClients: Map<number, StreamLabsSocketClient> = new Map();

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

    public async connect(twitchAccountId: string): Promise<void> {
        const userView: UserView = await twitchRepository.getUserByAccountId(twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with User.`);
        })();
        const streamLabsId: number = user.streamlabs_id ?? ((): number => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with StreamLabs account.`);
        })();

        const streamLabs: StreamLabs = await streamLabsRepository.getById(streamLabsId);
        const accessToken: string = streamLabs.access_token ?? ((): string => {
            throw new Error(`StreamLabs Account '${streamLabs.account_id}' does not have Authorization token`);
        })();
        const socketToken: string = streamLabs.socket_token ?? ((): string => {
            throw new Error(`StreamLabs Account '${streamLabs.account_id}' does not have Authorization token`);
        })();

        const httpclient: StreamLabsHttpClient = StreamLabsHttpClient.createInstance(accessToken);
        this.httpClients.set(user.id, httpclient);

        const socketClient: StreamLabsSocketClient = StreamLabsSocketClient.createInstance(user, socketToken);
        this.socketClients.set(user.id, socketClient);
    }

    public getHttpClient(userId: number): StreamLabsHttpClient {
        return this.httpClients.get(userId) ?? ((): StreamLabsHttpClient => {
            throw new Error("StreamLabs HTTP client is undefined.");
        })();
    }

    private async getOauthTokens(authorizationCode: string): Promise<OauthTokens> {
        const httpclient: StreamLabsHttpClient = StreamLabsHttpClient.createInstance("");
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

    private async getSocketToken(accessToken: string): Promise<SocketToken> {
        const httpclient: StreamLabsHttpClient = StreamLabsHttpClient.createInstance(accessToken);
        const socketTokenResponse: AxiosResponse<SocketTokenResponse> = await httpclient.getSocketToken();
        const socketToken: string = socketTokenResponse.data.socket_token ?? ((): string => {
            throw new Error("Socket Token is undefined.");
        })();

        return {
            socketToken: socketToken
        };
    }

    private async getAccountIds(accessToken: string): Promise<AccountIds> {
        const httpclient: StreamLabsHttpClient = StreamLabsHttpClient.createInstance(accessToken);
        const userResponse: AxiosResponse<UserResponse> = await httpclient.getUser();
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
        const twitch: Twitch = await twitchRepository.getOrInsertByAccountId(accountIds.twitch);
        const streamLabsId: IdView = await streamLabsRepository.getOrCreateStreamLabsId(accountIds.streamLabs, twitch.id);

        return await streamLabsRepository.updateTokens(streamLabsId.id, oauthTokens.accessToken, oauthTokens.refreshToken, socketToken.socketToken);
    }

}

export default new StreamLabsService();
