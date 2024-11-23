import {Body, Controller, Get, Post, Query, Redirect} from "@nestjs/common";

import {StreamLabsService} from "./service";

@Controller("streamlabs")
export class StreamLabsController {

    constructor(
        private readonly streamLabsService: StreamLabsService
    ) {}

    @Redirect()
    @Get("login")
    public async login(): Promise<{ url: URL }> {
        const url: URL = await this.streamLabsService.login();
        return {url: url};
    }

    @Get("oauth/callback")
    public async oauthCallback(@Query() code: string): Promise<void> {
        await this.streamLabsService.oauthCallback(code);
    }

    @Post("connect")
    public async connect(@Body() body: { accountId: string }): Promise<void> {
        const accountId: string = body.accountId;
        await this.streamLabsService.connect(accountId);
    }
}
