import {Controller, Get, Post, Query, Redirect} from "@nestjs/common";

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

    @Get("oauth/callback")
    public async oauthCallback(@Query() code: string): Promise<void> {
        await this.chatbotService.oauthCallback(code);
    }

    @Post("connect")
    public async connect(): Promise<void> {
        await this.chatbotService.connect();
    }

    @Post("disconnect")
    public async disconnect(): Promise<void> {
        await this.chatbotService.disconnect();
    }

}
