import {Controller, Get, Redirect} from "@nestjs/common";

import {ChatbotService} from "./service";

@Controller("application/chatbot")
export class ChatbotController {

    constructor(
        private readonly chatbotService: ChatbotService
    ) {}

    @Redirect()
    @Get("authorize")
    public async authorize(): Promise<{ url: URL }> {
        const url: URL = await this.chatbotService.authorize();
        return {url: url};
    }

}
