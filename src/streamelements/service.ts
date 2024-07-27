import {AxiosResponse} from "../axios";
import {IdView, UserView} from "../views";

import {User} from "@prisma/client";
import streamElementsRepository, {StreamElements} from "./repository";
import twitchRepository from "../twitch/repository";

import {AccountIds} from "./types";

import StreamElementsSocketClient from "./client/socket";
import StreamElementsHttpClient, {CurrentUserChannel, CurrentUserRequest} from "./client/http";

class StreamElementsService {

    private httpClients: Map<number, StreamElementsHttpClient> = new Map();
    private socketClients: Map<number, StreamElementsSocketClient> = new Map();

    public async login(jwt: string): Promise<void> {
        const accountIds: AccountIds = await this.getAccountIds(jwt);
        await this.setTokens(accountIds, jwt);
        await this.connect(accountIds.twitch);
    }

    public async connect(twitchAccountId: string): Promise<void> {
        const userView: UserView = await twitchRepository.getUser(twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with User.`);
        })();
        const streamElementsId: number = user.streamelements_id ?? ((): number => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with StreamElements account.`);
        })();

        const streamElements: StreamElements = await streamElementsRepository.getById(streamElementsId);
        const jwt: string = streamElements.jwt ?? ((): string => {
            throw new Error(`StreamElements Account '${streamElements.account_id}' does not have Authorization token.`);
        })();

        const httpclient: StreamElementsHttpClient = StreamElementsHttpClient.createInstance(jwt);
        this.httpClients.set(user.id, httpclient);

        const socketClient: StreamElementsSocketClient = StreamElementsSocketClient.createInstance(user, jwt);
        this.socketClients.set(user.id, socketClient);
    }

    public async getHttpClient(userId: number): Promise<StreamElementsHttpClient> {
        return this.httpClients.get(userId) ?? ((): StreamElementsHttpClient => {
            throw new Error("StreamElements HTTP client is undefined.");
        })();
    }

    private async getAccountIds(jwt: string): Promise<AccountIds> {
        const httpclient: StreamElementsHttpClient = StreamElementsHttpClient.createInstance(jwt);
        const userResponse: AxiosResponse<CurrentUserRequest> = await httpclient.getCurrentUser();
        const twitchAccountId: string = userResponse.data.channels.find((channel: CurrentUserChannel): boolean => channel.provider == "twitch")?.providerId ?? ((): string => {
            throw new Error("Twitch Account ID is undefined.");
        })();
        const streamElementsAccountId: string = userResponse.data._id ?? ((): string => {
            throw new Error("StreamElements Account ID is undefined.");
        })();

        return {
            twitch: twitchAccountId,
            streamElements: streamElementsAccountId
        };
    }

    private async setTokens(accountIds: AccountIds, jwt: string): Promise<StreamElements> {
        const twitchId: IdView = await twitchRepository.getOrInsertTwitchId(accountIds.twitch);
        const streamElementsId: IdView = await streamElementsRepository.getOrCreateStreamElementsId(accountIds.streamElements, twitchId.id);

        return await streamElementsRepository.updateTokens(streamElementsId.id, jwt);
    }

}

export default new StreamElementsService();
