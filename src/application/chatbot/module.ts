import {Module} from "@nestjs/common";
import {HttpModule} from "@nestjs/axios";

import {ApplicationChatbotController} from "@chimera/application/chatbot/controller";
import {ApplicationChatbotService} from "@chimera/application/chatbot/service";

import {TwitchModule} from "@chimera/twitch/module";

@Module({
    imports: [HttpModule, TwitchModule],
    controllers: [ApplicationChatbotController],
    providers: [ApplicationChatbotService],
    exports: [ApplicationChatbotService]
})
export class ApplicationChatbotModule {}
