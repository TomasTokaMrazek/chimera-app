import {Injectable, Logger} from "@nestjs/common";

import {differenceInSeconds, isValid} from "date-fns";
import {ApiClient, HelixUser} from "@twurple/api";
import {BaseApiClient} from "@twurple/api/lib/client/BaseApiClient";
import {EventSubChannelChatMessageEvent} from "@twurple/eventsub-base/lib/events/EventSubChannelChatMessageEvent";

import {TwitchService} from "@chimera/twitch/service";

import {WheelService} from "@chimera/application/utils/wheel/service";
import {RaffleService, RaffleUser} from "@chimera/application/command/model/raffle";

import {chunkArray} from "@chimera/utils/array";

import configuration from "@chimera/configuration";

const chatbotAccountId: string = configuration.app.chatbot.twitch.accountId;
const agraelusUserAccountId: string = configuration.app.agraelus.twitch.userAccountId;
const agraelusAdminAccountId: string[] = configuration.app.agraelus.twitch.adminAccountIds;

@Injectable()
export class AgraelusService {

    private readonly logger: Logger = new Logger(AgraelusService.name);

    private lastMessage: Date = new Date(NaN);
    private numberOfUsers: number = 0;
    private users: string[] = [];

    constructor(
        private readonly raffleService: RaffleService,
        private readonly wheelService: WheelService,
        private readonly twitchService: TwitchService
    ) {}

    readonly handleEvent: (event: EventSubChannelChatMessageEvent) => Promise<void> = async (event: EventSubChannelChatMessageEvent): Promise<void> => {
        const chatterUserId: string = event.chatterId;
        const chatMessage: string = event.messageText;

        if (agraelusAdminAccountId.includes(chatterUserId)) {
            if (isValid(this.lastMessage)) {
                const difference: number = differenceInSeconds(new Date(), this.lastMessage);
                if (difference > 10) {
                    this.reset();
                }
            }

            if (chatMessage.startsWith("Seznam")) {
                this.lastMessage = new Date();
                this.logger.log(`WheelOfNames | Last Message: ${this.lastMessage}`);
                const numberOfUsers: string = chatMessage.substring(chatMessage.indexOf("Seznam[") + 7, chatMessage.indexOf("]") + 1);
                this.numberOfUsers = parseInt(numberOfUsers);
                const users: string[] = chatMessage
                    .substring(chatMessage.indexOf("- ") + 2)
                    .split(";")
                    .map((user: string): string => user.trim())
                    .filter((user: string): boolean => user.length > 0);
                this.logger.log(`WheelOfNames | Number of Users: ${users.length}`);
                this.users.push(...users);
            } else if (isValid(this.lastMessage)) {
                this.lastMessage = new Date();
                this.logger.log(`WheelOfNames | Last Message: ${this.lastMessage}`);
                const users: string[] = chatMessage
                    .split(";")
                    .map((user: string): string => user.trim())
                    .filter((user: string): boolean => user.length > 0);
                this.logger.log(`WheelOfNames | Number of Users: ${users.length}`);
                this.users.push(...users);
            } else {
                return;
            }

            if (this.users.length === this.numberOfUsers) {
                this.logger.log(`WheelOfNames | Number: ${this.numberOfUsers}, Users: ${this.users}`);

                const filteredUsers: RaffleUser[] = [];

                const apiClient: ApiClient = await this.twitchService.getApiClient();

                const validUsers: string[] = this.users.filter((user: string): boolean => /^(?!_)\w{3,25}$/.test(user));

                const uniqueUsers: string[] = validUsers.filter((user: string, index: number, self: string[]): boolean =>
                    self.findIndex((u: string): any => u === user) === index
                );

                const uniqueUserChunks: string[][] = chunkArray(uniqueUsers, 100);
                const helixUsers: HelixUser[] = [];
                for (const chunk of uniqueUserChunks) {
                    const usersFromApi: HelixUser[] = await apiClient.users.getUsersByNames(chunk);
                    helixUsers.push(...usersFromApi);
                }

                const helixUserChunks: HelixUser[][] = chunkArray(helixUsers, 100);
                const helixUserColors: Map<string, string | null> = new Map();
                for (const chunk of helixUserChunks) {
                    const colorsFromApi: Map<string, string | null> = await apiClient.chat.getColorsForUsers(chunk);
                    colorsFromApi.forEach((value: string | null, key: string): void => {
                        helixUserColors.set(key, value);
                    });
                }

                for (const helixUser of helixUsers) {
                    filteredUsers.push({
                        username: helixUser.displayName,
                        color: helixUserColors.get(helixUser.id) ?? null
                    });
                }

                const user: HelixUser = await apiClient.users.getUserById(agraelusUserAccountId) ?? ((): HelixUser => {
                    throw new Error(`Twitch Account ID '${agraelusUserAccountId}' not found.`);
                })();
                const displayName: string = user.displayName;
                const profilePictureUrl: string = user.profilePictureUrl;

                this.logger.log(`ProfilePictureUrl: ${profilePictureUrl}`);

                const url: string = await this.wheelService.generate(displayName, profilePictureUrl, filteredUsers);
                this.logger.log(`WheelOfNames URL: ${url}`);

                await apiClient.asUser(chatbotAccountId, async (ctx: BaseApiClient): Promise<void> => {
                    await ctx.chat.sendChatMessage(agraelusUserAccountId, url + " <- agrTocka @Agraelus");
                });
                this.reset();
            }
        }
    };

    private reset(): void {
        this.lastMessage = new Date(NaN);
        this.numberOfUsers = 0;
        this.users = [];
    }

}
