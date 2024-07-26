import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../axios";
import {IdView, UserView} from "../views";

import streamElementsRepository, {StreamElements} from "./repository";
import twitchRepository from "../twitch/repository";

import {AccountIds} from "./types";
import streamElementsSocketClient from "./socket";

import configuration from "../configuration";
import {User} from "@prisma/client";

const streamElementsApi: string = configuration.streamElements.apiUrl;

class StreamElementsService {

    public async login(jwt: string): Promise<void> {
        const accountIds: AccountIds = await this.getAccountIds(jwt);
        await this.setTokens(accountIds, jwt);
        await this.connectToWebSocket(jwt);
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
            throw new Error(`StreamLabs Account '${streamElements.account_id}' is not associated with StreamLabs account.`);
        })();

        await streamElementsSocketClient.openSocket(jwt);
    }

    private async getAccountIds(jwt: string): Promise<AccountIds> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${jwt}`
            }
        };

        const userResponse: AxiosResponse<any, any> = await axiosInstance.get(streamElementsApi + "/users/current", config);
        const twitchAccountId: string = String(userResponse.data.channels.find((channel: any): boolean => channel.provider == "twitch")?.providerId ?? ((): void => {
            throw new Error("Twitch Account ID is undefined.");
        }));
        const streamElementsAccountId: string = String(userResponse.data._id) ?? ((): void => {
            throw new Error("StreamLabs Account ID is undefined.");
        });

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

    public async connectToWebSocket(socketToken: string) {
        return await streamElementsSocketClient.openSocket(socketToken);
    }

}

export default new StreamElementsService();
