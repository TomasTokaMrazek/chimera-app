import {Injectable, Logger, OnModuleInit} from "@nestjs/common";

import {EventSubWsListener} from "@twurple/eventsub-ws";
import {EventSubSubscription} from "@twurple/eventsub-base/lib/subscriptions/EventSubSubscription";
import {EventSubChannelChatMessageEvent} from "@twurple/eventsub-base/lib/events/EventSubChannelChatMessageEvent";

import {TwitchService} from "@chimera/twitch/service";

import configuration from "@chimera/configuration";

const userAccountId: string = configuration.app.chatbot.twitch.userAccountId;

@Injectable()
export class ApplicationChatbotService implements OnModuleInit {

    private readonly logger: Logger = new Logger(ApplicationChatbotService.name);

    constructor(
        private readonly twitchService: TwitchService
    ) {}

    async authorize(): Promise<URL> {
        return this.twitchService.authorize("user:read:chat user:write:chat");
    }

    async onModuleInit(): Promise<void> {
        await this.twitchService.login(userAccountId);

        const eventSubWsListener: EventSubWsListener = await this.twitchService.getEventSubWsListener()
        const channelChatMessageSubscriontion: EventSubSubscription = eventSubWsListener.onChannelChatMessage(userAccountId, userAccountId, (event: EventSubChannelChatMessageEvent): void => {
            this.logger.verbose(event);
        });
    }

}
