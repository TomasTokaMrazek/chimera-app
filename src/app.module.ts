import {Module} from "@nestjs/common";
import {APP_PIPE} from "@nestjs/core";

import {ZodValidationPipe} from "nestjs-zod";

import {PrismaModule} from "prisma.module";
import {TwitchModule} from "@chimera/twitch/module";
import {StreamElementsModule} from "@chimera/streamelements/module";
import {StreamLabsModule} from "@chimera/streamlabs/module";
import {ApplicationChatbotModule} from "@chimera/application/chatbot/module";
import {ApplicationEventModule} from "@chimera/application/event/module";
import {ApplicationAgraelusModule} from "@chimera/application/agraelus/module";

@Module({
    imports: [PrismaModule, TwitchModule, StreamElementsModule, StreamLabsModule, ApplicationChatbotModule, ApplicationEventModule, ApplicationAgraelusModule],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe
        }
    ]
})
export class AppModule {}
