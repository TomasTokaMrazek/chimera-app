import {Injectable} from '@nestjs/common';
import {HttpService} from "@nestjs/axios";

import {AxiosResponse} from "axios";

import {TwitchRepository} from "@chimera/twitch/repository/repository";
import {Twitch, StreamElements} from "@prisma/client";

import {AccountIds} from "./types";
import {StreamElementsRepository} from "./repository/repository";
import {IdView} from "./repository/views";

import StreamElementsHttpClient from "./client/http/client";
import * as HttpDto from "./client/http/dto";

import {StreamElementsSocketClientManager} from "@chimera/streamelements/client/socket/manager";

@Injectable()
export class StreamElementsService {

    constructor(
        private readonly httpService: HttpService,
        private readonly streamElementsRepository: StreamElementsRepository,
        private readonly streamElementsSocketClientManager: StreamElementsSocketClientManager,
        private readonly twitchRepository: TwitchRepository
    ) {}

    private readonly httpClients: Map<string, StreamElementsHttpClient> = new Map();

    public async login(jwt: string): Promise<void> {
        const accountIds: AccountIds = await this.getAccountIds(jwt);
        await this.setTokens(accountIds, jwt);
        await this.connect(accountIds.twitch);
    }

    public async connect(accountId: string): Promise<void> {
        const streamElements: StreamElements = await this.streamElementsRepository.getByAccountId(accountId);
        const jwt: string = streamElements.jwt ?? ((): string => {
            throw new Error(`StreamElements Account '${accountId}' does not have Authorization token.`);
        })();

        const httpclient: StreamElementsHttpClient = StreamElementsHttpClient.createInstance(this.httpService, jwt);
        this.httpClients.set(accountId, httpclient);

        await this.streamElementsSocketClientManager.createSocketClient(accountId);
    }

    public async getHttpClient(id: number): Promise<StreamElementsHttpClient> {
        const streamElements: StreamElements = await this.streamElementsRepository.getById(id);
        const accountId: string = streamElements.account_id ?? ((): string => {
            throw new Error(`StreamElements Account ID for ID '${id}' does not exist.`);
        })();

        return this.httpClients.get(accountId) ?? ((): StreamElementsHttpClient => {
            throw new Error("StreamElements HTTP client is undefined.");
        })();
    }

    private async getAccountIds(jwt: string): Promise<AccountIds> {
        const httpclient: StreamElementsHttpClient = StreamElementsHttpClient.createInstance(this.httpService, jwt);
        const userResponse: AxiosResponse<HttpDto.CurrentUserRequest> = await httpclient.getCurrentUser();
        const twitchAccountId: string = userResponse.data.channels.find((channel: HttpDto.CurrentUserChannel): boolean => channel.provider == "twitch")?.providerId ?? ((): string => {
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
        const twitch: Twitch = await this.twitchRepository.getOrInsertByAccountId(accountIds.twitch);
        const streamElementsId: IdView = await this.streamElementsRepository.getOrCreateStreamElementsId(accountIds.streamElements, twitch.id);

        return await this.streamElementsRepository.updateTokens(streamElementsId.id, jwt);
    }

}
