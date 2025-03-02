import {Injectable, Logger, OnModuleInit} from "@nestjs/common";

import {EventSubWsListener} from "@twurple/eventsub-ws";
import {EventSubChannelChatMessageEvent} from "@twurple/eventsub-base/lib/events/EventSubChannelChatMessageEvent";

import {ApiClient, HelixUser} from "@twurple/api";
import {CommandService} from "@chimera/application/command/service";
import {AgraelusService} from "@chimera/application/agraelus/service";
import {TwitchService} from "@chimera/twitch/service";

import configuration from "@chimera/configuration";

const accountId: string = configuration.app.chatbot.twitch.accountId;
const userAccountId: string[] = configuration.app.chatbot.twitch.userAccountIds;
const adminAccountIds: string[] = configuration.app.chatbot.twitch.adminAccountIds;

const agraelusAccountId: string = configuration.app.agraelus.twitch.userAccountId;

@Injectable()
export class ChatbotService implements OnModuleInit {

    private readonly logger: Logger = new Logger(ChatbotService.name);

    constructor(
        private readonly agraelusService: AgraelusService,
        private readonly commandService: CommandService,
        private readonly twitchService: TwitchService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.twitchService.login(accountId);

        const eventSubWsListener: EventSubWsListener = await this.twitchService.getEventSubWsListener();
        userAccountId.forEach((userAccountId: string): void => {
            eventSubWsListener.onChannelChatMessage(userAccountId, accountId, async (event: EventSubChannelChatMessageEvent): Promise<void> => {
                const message: string = event.messageText;
                const broadcaster: HelixUser = await event.getBroadcaster();
                const chatter: HelixUser = await event.getChatter();

                if (broadcaster.id === agraelusAccountId) {
                    await this.agraelusService.handleEvent(event);
                }

                if (this.commandService.isCommand(message)) {
                    const twitchApiClient: ApiClient = await this.twitchService.getApiClient()

                    let isUserAllowed: boolean;
                    if (chatter.id === broadcaster.id) {
                        isUserAllowed = true;
                    } else if (adminAccountIds.includes(chatter.id)) {
                        isUserAllowed = true;
                    } else {
                        isUserAllowed = await twitchApiClient.moderation.checkUserMod(broadcaster, chatter);
                    }

                    if (isUserAllowed) {
                        await this.commandService.executeCommand(message, broadcaster, chatter);
                    }
                }
            });
        });
    }

    async authorize(): Promise<URL> {
        return this.twitchService.authorize("user:read:chat user:write:chat");
    }

}
