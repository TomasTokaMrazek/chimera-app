import {Injectable} from "@nestjs/common";

import WebSocket from "ws";
import {isValid, differenceInSeconds, format} from "date-fns";
import {cs} from "date-fns/locale";

import {AxiosResponse} from "@chimera/axios";

import {TwitchRepository} from "@chimera/twitch/repository/repository";
import {IdView} from "@chimera/twitch/repository/views";

import {TwitchSocketClientManager} from "@chimera/twitch/client/socket/manager";
import TwitchSocketClient, {HandleMessageFunction} from "@chimera/twitch/client/socket/client";
import * as Message from "@chimera/twitch/client/socket/dto/message";
import * as Event from "@chimera/twitch/client/socket/dto/event";

import {TwitchHttpClientManager} from "@chimera/twitch/client/http/manager";
import TwitchHttpClient from "@chimera/twitch/client/http/client";
import * as EventSub from "@chimera/twitch/client/http/dto/eventsub";
import * as User from "@chimera/twitch/client/http/dto/user";
import * as Chat from "@chimera/twitch/client/http/dto/chat";

import WheelOfNamesClient from "@chimera/wheelofnames/client/http/client";
import * as Wheel from "@chimera/wheelofnames/client/http/dto";

import configuration from "@chimera/configuration";

const twitchWebsocketUrl: string = configuration.twitch.websocketUrl;
const twitchOauthUrl: string = configuration.twitch.oauthUrl;
const clientID: string = configuration.twitch.clientId;
const redirectUri: string = configuration.app.chatbot.redirectUri;
const userAccountId: string = configuration.app.chatbot.userAccountId;
const adminAccountId: string = configuration.app.chatbot.adminAccountId;

const wheelOfNamesUrl: string = configuration.wheelOfNames.url;

const cekybotAccountId: string = "807488577"; //cekybot2
const tokaAccountId: string = "69887790"; //TokaTheFirst
const agraelusAccountId: string = "36620767"; //Agraelus
const appAccountId: string = "1119298268"; //ChimeraApp

@Injectable()
export class ApplicationAgraelusService {

    constructor(
        private readonly twitchRepository: TwitchRepository,
        private readonly twitchSocketClientManager: TwitchSocketClientManager,
        private readonly twitchHttpClientManager: TwitchHttpClientManager
    ) {}

    private firstMessage: Date = new Date(NaN);
    private numberOfUsers: number = 0;
    private users: string[] = [];

    private subscriptionId: string = "";

    private handleMessage: HandleMessageFunction = async (data: WebSocket.RawData): Promise<void> => {
        const parsedData = JSON.parse(data.toString());
        const messageType: string = parsedData.metadata.message_type;
        switch (messageType) {
            case "notification": {
                const message: Message.NotificationMessage = parsedData as Message.NotificationMessage;
                if (message.payload.subscription.id !== this.subscriptionId) {
                    return;
                }

                const event: Event.ChannelChatMessage = message.payload.event as Event.ChannelChatMessage;

                const chatterUserId: string = event.chatter_user_id;
                const chatMessage: string = event.message.text;
                if (chatterUserId === tokaAccountId || chatterUserId === cekybotAccountId) {
                    if (isValid(this.firstMessage)) {
                        const difference: number = differenceInSeconds(new Date(), this.firstMessage);
                        if (difference > 10) {
                            this.reset();
                        }
                    }

                    if (chatMessage.startsWith("Seznam")) {
                        this.firstMessage = new Date();
                        const numberOfUsers: string = chatMessage.substring(chatMessage.indexOf("Seznam[") + 7, chatMessage.indexOf("]") + 1);
                        this.numberOfUsers = parseInt(numberOfUsers);
                        const users: string[] = chatMessage
                            .substring(chatMessage.indexOf("- ") + 2)
                            .split(";")
                            .map((user: string) => user.trim())
                            .filter((user: string): boolean => user.length > 0);
                        this.users.push(...users);
                    } else if (isValid(this.firstMessage)) {
                        const users: string[] = chatMessage
                            .split(";")
                            .map((user: string) => user.trim())
                            .filter((user: string): boolean => user.length > 0);
                        this.users.push(...users);
                    } else {
                        return;
                    }

                    if (this.users.length === this.numberOfUsers) {
                        console.log(`WheelOfNames | Number: ${this.numberOfUsers}, Users: ${this.users}`);
                        const path: string = await this.wheelOfNames();
                        const url: string = wheelOfNamesUrl.concat("/").concat(path);
                        console.log(`WheelOfNames URL: ${url}`);
                        const idView: IdView = await this.twitchRepository.getIdByAccountId(userAccountId);
                        const httpClient: TwitchHttpClient = await this.twitchHttpClientManager.getHttpClient(idView.id);
                        const body: Chat.SendChatMessageRequestBody = {
                            broadcaster_id: agraelusAccountId,
                            sender_id: userAccountId,
                            message: url + " <- agrTocka @Agraelus"
                        };
                        await httpClient.sentChatMessage(body);
                        this.reset();
                    }
                }
                break;
            }
        }
    };

    public async connect(): Promise<void> {
        if (this.subscriptionId.length > 0) {
            return;
        }

        const idView: IdView = await this.twitchRepository.getIdByAccountId(userAccountId);
        const socketClient: TwitchSocketClient = await this.twitchSocketClientManager.getSocketClient(idView.id);

        const sessionId: string = socketClient.sessionId;

        const requestBody: EventSub.CreateEventSubSubscriptionRequestBody = {
            type: "channel.chat.message",
            version: "1",
            condition: {
                broadcaster_user_id: agraelusAccountId,
                user_id: userAccountId
            },
            transport: {
                method: EventSub.EventSubSubscriptionTransportMethod.WEBSOCKET,
                session_id: sessionId
            }
        };

        this.subscriptionId = await socketClient.subscribe(idView.id, requestBody, this.handleMessage);
        console.log(`Agraelus Spin Wheel event subscription id: ${this.subscriptionId}`);
    }

    public async disconnect(): Promise<void> {
        const idView: IdView = await this.twitchRepository.getIdByAccountId(userAccountId);
        const socketClient: TwitchSocketClient = await this.twitchSocketClientManager.getSocketClient(idView.id);

        const requestParams: EventSub.DeleteEventSubSubscriptionRequestParams = {
            id: this.subscriptionId
        };

        await socketClient.unsubscribe(idView.id, requestParams, this.handleMessage);

        this.subscriptionId = "";
    }

    private reset(): void {
        this.firstMessage = new Date(NaN);
        this.numberOfUsers = 0;
        this.users = [];
    }

    private async wheelOfNames(): Promise<string> {
        const idView: IdView = await this.twitchRepository.getIdByAccountId(userAccountId);
        const httpClient: TwitchHttpClient = await this.twitchHttpClientManager.getHttpClient(idView.id);

        const uniqueUsers: Set<string> = new Set(this.users.filter((user: string) => !/\W/.test(user)));

        const chunk = (size: number) => (array: any[]) => array.reduce((result: any[][], item: any) => {
            if (result[result.length - 1].length < size) {
                result[result.length - 1].push(item);
            } else {
                result.push([item]);
            }
            return result;
        }, [[]]);

        const getUsersResponses: AxiosResponse<User.GetUsersResponseBody>[] = await Promise.all(
            chunk(100)(Array.from(uniqueUsers)).map((chunkUsers: string[]): Promise<AxiosResponse<User.GetUsersResponseBody>> => {
                const requestParams: User.GetUsersRequestParams = {
                    login: chunkUsers
                };
                return httpClient.getUsers(requestParams);
            })
        );

        const twitchUsers: User.GetUsersResponseData[] = getUsersResponses.flatMap((response: AxiosResponse<User.GetUsersResponseBody>) => {
            return response.data.data;
        });

        const getUsersChatColorResponses: AxiosResponse<Chat.GetUsersChatColorResponseBody>[] = await Promise.all(
            chunk(100)(twitchUsers).map((chunkUsers: User.GetUsersResponseData[]): Promise<AxiosResponse<Chat.GetUsersChatColorResponseBody>> => {
                const requestParams: Chat.GetUsersChatColorRequestParams = {
                    user_id: chunkUsers.map((chunkUser: User.GetUsersResponseData) => chunkUser.id)
                };
                return httpClient.getUsersChatColor(requestParams);
            })
        );

        const twitchUsersWithColor: Chat.GetUsersChatColorResponseData[] = getUsersChatColorResponses.flatMap((response: AxiosResponse<Chat.GetUsersChatColorResponseBody>) => {
            return response.data.data;
        });

        const entries: Wheel.Entry[] = Array.from(twitchUsersWithColor)
            .map((twitchUserWithColor: Chat.GetUsersChatColorResponseData) => {
                const entry: Wheel.Entry = {
                    text: twitchUserWithColor.user_name,
                    color: twitchUserWithColor.color,
                    weight: 1
                };
                return entry;
            });

        const body: Wheel.PostRequest = {
            wheelConfig: {
                description: "Točka pro agrBajs ze dne " + format(new Date(), "EEEE, d MMMM yyyy", {locale: cs}),
                title: "Agraelus",
                type: Wheel.Type.COLOR,
                spinTime: 5,
                hubSize: Wheel.HubSize.L,
                entries: entries,
                isAdvanced: true,
                customPictureDataUri: "https://static-cdn.jtvnw.net/jtv_user_pictures/ea3d506d-0339-40e7-ae44-eb104d5a546b-profile_image-600x600.png",
                pictureType: Wheel.PictureType.UPLOADED,
                allowDuplicates: false
            },
            shareMode: Wheel.ShareMode.COPYABLE
        };

        const wheelOfNamesClient: WheelOfNamesClient = WheelOfNamesClient.createInstance();
        const response: AxiosResponse<Wheel.PostResponse> = await wheelOfNamesClient.createSharedWheel(body);
        if (response.status !== 200) {
            throw new Error("Unable to create Wheel Of Names.");
        }

        return response.data.data.path;
    }

}
