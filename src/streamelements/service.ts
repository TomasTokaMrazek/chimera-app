import {Injectable} from "@nestjs/common";
import {HttpService} from "@nestjs/axios";

import {AxiosResponse} from "axios";

import {StreamElements, Twitch} from "@chimera/prisma/client";

import {TwitchRepository} from "@chimera/twitch/repository/repository";

import {StreamElementsRepository} from "./repository/repository";
import {IdView} from "./repository/views";
import {StreamElementsHttpClient} from "./client/http/client";
import * as HttpDto from "./client/http/dto";

@Injectable()
export class StreamElementsService {

    constructor(
        private readonly httpService: HttpService,
        private readonly streamElementsRepository: StreamElementsRepository,
        private readonly twitchRepository: TwitchRepository
    ) {}

    private readonly httpClients: Map<string, StreamElementsHttpClient> = new Map();

    public async authorize(jwt: string): Promise<void> {
        const httpClient: StreamElementsHttpClient = StreamElementsHttpClient.createInstance(this.httpService, jwt);
        const userResponse: AxiosResponse<HttpDto.CurrentUserRequest> = await httpClient.getCurrentUser();
        const channel: any = userResponse.data.channels.find((channel: HttpDto.CurrentUserChannel): boolean => channel.provider == "twitch") ?? ((): any => {
            throw new Error("StreamElements Twitch  is undefined.");
        })();
        const channelTwitchAccountId: string = channel.providerId ?? ((): string => {
            throw new Error("Channel Twitch Account ID is undefined.");
        })();
        const channelStreamElementsAccountId: string = channel._id ?? ((): string => {
            throw new Error("Channel StreamElements Account ID is undefined.");
        })();

        const twitch: Twitch = await this.twitchRepository.getOrInsertByAccountId(channelTwitchAccountId);
        const streamElementsId: IdView = await this.streamElementsRepository.getOrInsertStreamElementsId(channelStreamElementsAccountId, twitch.id);

        await this.streamElementsRepository.updateTokens(streamElementsId.id, jwt);
    }

    public async getHttpClient(accountId: string): Promise<StreamElementsHttpClient> {
        if (!this.httpClients.has(accountId)) {
            const streamElements: StreamElements = await this.streamElementsRepository.getByAccountId(accountId);
            const jwt: string = streamElements.jwt ?? ((): string => {
                throw new Error(`StreamElements Account ID '${accountId}' jwt does not exist.`);
            })();
            const httpClient: StreamElementsHttpClient = StreamElementsHttpClient.createInstance(this.httpService, jwt);
            this.httpClients.set(accountId, httpClient);
        }
        return this.httpClients.get(accountId) ?? ((): StreamElementsHttpClient => {
            throw new Error("StreamElements HTTP client is undefined.");
        })();
    }

}
