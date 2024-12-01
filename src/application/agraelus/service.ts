import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {HttpService} from "@nestjs/axios";

import {AxiosResponse} from "axios";
import {differenceInSeconds, format, isValid} from "date-fns";
import {cs} from "date-fns/locale";

import {ApiClient, HelixUser} from "@twurple/api";
import {BaseApiClient} from "@twurple/api/lib/client/BaseApiClient";
import {EventSubWsListener} from "@twurple/eventsub-ws";
import {EventSubSubscription} from "@twurple/eventsub-base/lib/subscriptions/EventSubSubscription";
import {EventSubChannelChatMessageEvent} from "@twurple/eventsub-base/lib/events/EventSubChannelChatMessageEvent";

import {TwitchService} from "@chimera/twitch/service";

import WheelOfNamesClient from "@chimera/wheelofnames/client/http/client";
import * as Wheel from "@chimera/wheelofnames/client/http/dto";

import configuration from "@chimera/configuration";

const chatbotAccountId: string = configuration.app.chatbot.twitch.userAccountId;
const agraelusUserAccountId: string = configuration.app.agraelus.twitch.userAccountId;
const agraelusAdminAccountId: string[] = configuration.app.agraelus.twitch.adminAccountIds;
const wheelOfNamesUrl: string = configuration.wheelOfNames.url;

@Injectable()
export class ApplicationAgraelusService implements OnModuleInit {

    private readonly logger: Logger = new Logger(ApplicationAgraelusService.name);

    private firstMessage: Date = new Date(NaN);
    private numberOfUsers: number = 0;
    private users: string[] = [];

    constructor(
        private readonly httpService: HttpService,
        private readonly twitchService: TwitchService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.twitchService.login(chatbotAccountId);

        const eventSubWsListener: EventSubWsListener = await this.twitchService.getEventSubWsListener();
        const channelChatMessageSubscriontion: EventSubSubscription = eventSubWsListener.onChannelChatMessage(agraelusUserAccountId, chatbotAccountId, this.handleEvent);
    }

    private readonly handleEvent: (event: EventSubChannelChatMessageEvent) => Promise<void> = async (event: EventSubChannelChatMessageEvent): Promise<void> => {
        const chatterUserId: string = event.chatterId;
        const chatMessage: string = event.messageText;
        if (agraelusAdminAccountId.includes(chatterUserId)) {
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
                    .map((user: string): string => user.trim())
                    .filter((user: string): boolean => user.length > 0);
                this.users.push(...users);
            } else if (isValid(this.firstMessage)) {
                const users: string[] = chatMessage
                    .split(";")
                    .map((user: string): string => user.trim())
                    .filter((user: string): boolean => user.length > 0);
                this.users.push(...users);
            } else {
                return;
            }

            if (this.users.length === this.numberOfUsers) {
                this.logger.log(`WheelOfNames | Number: ${this.numberOfUsers}, Users: ${this.users}`);
                const path: string = await this.wheelOfNames();
                const url: string = wheelOfNamesUrl.concat("/").concat(path);
                this.logger.log(`WheelOfNames URL: ${url}`);
                const apiClient: ApiClient = await this.twitchService.getApiClient();
                await apiClient.asUser(chatbotAccountId, async (ctx: BaseApiClient): Promise<void> => {
                    await ctx.chat.sendChatMessage(agraelusUserAccountId, url + " <- agrTocka @Agraelus");
                });
                this.reset();
            }
        }
    };

    private reset(): void {
        this.firstMessage = new Date(NaN);
        this.numberOfUsers = 0;
        this.users = [];
    }

    private async wheelOfNames(): Promise<string> {
        const uniqueUsers: Array<string> = Array.from(new Set(this.users.filter((user: string): boolean => !/\W/.test(user))));

        const apiClient: ApiClient = await this.twitchService.getApiClient();
        const helixUsers: HelixUser[] = await apiClient.users.getUsersByNames(uniqueUsers);
        const helixUserColors: Map<string, string | null> = await apiClient.chat.getColorsForUsers(helixUsers);

        const entries: Wheel.Entry[] = helixUsers.map((user: HelixUser): Wheel.Entry => {
            return {
                text: user.displayName,
                color: helixUserColors.get(user.id) ?? undefined,
                weight: 1
            };
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

        const wheelOfNamesClient: WheelOfNamesClient = WheelOfNamesClient.createInstance(this.httpService);
        const response: AxiosResponse<Wheel.PostResponse> = await wheelOfNamesClient.createSharedWheel(body);
        if (response.status !== 200) {
            throw new Error("Unable to create Wheel Of Names.");
        }

        return response.data.data.path;
    }

}
