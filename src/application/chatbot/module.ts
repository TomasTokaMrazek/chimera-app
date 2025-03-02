import {Module} from "@nestjs/common";
import {HttpModule} from "@nestjs/axios";

import {TwitchModule} from "@chimera/twitch/module";
import {CommandModule} from "@chimera/application/command/module";

import {ChatbotController} from "@chimera/application/chatbot/controller";
import {ChatbotService} from "@chimera/application/chatbot/service";
import {AgraelusModule} from "@chimera/application/agraelus/module";

@Module({
    imports: [HttpModule, AgraelusModule, CommandModule, TwitchModule],
    controllers: [ChatbotController],
    providers: [ChatbotService],
    exports: [ChatbotService]
})
export class ChatbotModule {}
