import {Controller, Get, Redirect} from "@nestjs/common";

import {ApplicationChatbotService} from "./service";

@Controller("application/chatbot")
export class ApplicationChatbotController {

    constructor(
        private readonly chatbotService: ApplicationChatbotService
    ) {}

    @Redirect()
    @Get("login")
    public async login(): Promise<{ url: URL }> {
        const url: URL = await this.chatbotService.login();
        return {url: url};
    }

}
