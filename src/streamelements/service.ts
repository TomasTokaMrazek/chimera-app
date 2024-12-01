import {Injectable} from "@nestjs/common";
import {HttpService} from "@nestjs/axios";

import {AxiosResponse} from "axios";

import {TwitchRepository} from "@chimera/twitch/repository/repository";
import {StreamElements, Twitch} from "@prisma/client";

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

    public async login(jwt: string): Promise<void> {
        const httpclient: StreamElementsHttpClient = StreamElementsHttpClient.createInstance(this.httpService, jwt);
        const userResponse: AxiosResponse<HttpDto.CurrentUserRequest> = await httpclient.getCurrentUser();
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

    public async getHttpClient(id: number): Promise<StreamElementsHttpClient> {
        const streamElements: StreamElements = await this.streamElementsRepository.getById(id);
        const accountId: string = streamElements.account_id ?? ((): string => {
            throw new Error(`StreamElements Account ID for ID '${id}' does not exist.`);
        })();

        return this.httpClients.get(accountId) ?? ((): StreamElementsHttpClient => {
            throw new Error("StreamElements HTTP client is undefined.");
        })();
    }

}
