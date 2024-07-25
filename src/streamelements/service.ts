import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../axios";
import {IdView} from "../views";

import streamElementsRepository, {StreamElements} from "./repository";
import twitchRepository from "../twitch/repository";

import {AccountIds} from "./types";
import streamElementsSocketClient from "./socket";

import configuration from "../configuration";

const streamElementsApi: string = configuration.streamElements.apiUrl;

class StreamElementsService {

    public async getAccountIds(jwt: string): Promise<AccountIds> {
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

    public async setTokens(accountIds: AccountIds, jwt: string): Promise<StreamElements> {
        const twitchId: IdView = await twitchRepository.getOrInsertTwitchId(accountIds.twitch);
        const streamElementsId: IdView = await streamElementsRepository.getOrCreateStreamElementsId(accountIds.streamElements, twitchId.id);

        return await streamElementsRepository.updateTokens(streamElementsId.id, jwt);
    }

    public async connectToWebSocket(socketToken: string) {
        return await streamElementsSocketClient.openSocket(socketToken);
    }

}

export default new StreamElementsService();
