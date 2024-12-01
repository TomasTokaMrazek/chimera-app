import {Controller, Get, Redirect} from "@nestjs/common";

import {ApplicationChatbotService} from "./service";

@Controller("application/chatbot")
export class ApplicationChatbotController {

    constructor(
        private readonly chatbotService: ApplicationChatbotService
    ) {}

    @Redirect()
    @Get("authorize")
    public async authorize(): Promise<{ url: URL }> {
        const url: URL = await this.chatbotService.authorize();
        return {url: url};
    }

}
