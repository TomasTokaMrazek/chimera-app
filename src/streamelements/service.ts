import {Injectable} from '@nestjs/common';

import {AxiosResponse} from "@chimera/axios";

import {TwitchRepository} from "@chimera/twitch/repository/repository";
import {UserView} from "@chimera/twitch/repository/views";
import {Twitch, User, StreamElements} from "@prisma/client";

import {AccountIds} from "./types";
import {StreamElementsRepository} from "./repository/repository";
import {IdView} from "./repository/views";

import StreamElementsHttpClient from "./client/http/client";
import * as HttpDto from "./client/http/dto";

import StreamElementsSocketClient from "./client/socket/client";

@Injectable()
export class StreamElementsService {

    constructor(
        private readonly streamElementsRepository: StreamElementsRepository,
        private readonly twitchRepository: TwitchRepository
    ) {}

    private readonly httpClients: Map<number, StreamElementsHttpClient> = new Map();
    private readonly socketClients: Map<number, StreamElementsSocketClient> = new Map();

    public async login(jwt: string): Promise<void> {
        const accountIds: AccountIds = await this.getAccountIds(jwt);
        await this.setTokens(accountIds, jwt);
        await this.connect(accountIds.twitch);
    }

    public async connect(twitchAccountId: string): Promise<void> {
        const userView: UserView = await this.twitchRepository.getUserByAccountId(twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with User.`);
        })();
        const streamElementsId: number = user.streamelements_id ?? ((): number => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with StreamElements account.`);
        })();

        const streamElements: StreamElements = await this.streamElementsRepository.getById(streamElementsId);
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
