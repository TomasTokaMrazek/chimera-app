import {Controller, Get, Query, Redirect} from "@nestjs/common";

import {TwitchService} from "./service";

@Controller("twitch")
export class TwitchController {

    constructor(
        private readonly twitchService: TwitchService
    ) {}

    @Redirect()
    @Get("login")
    public async login(): Promise<{ url: URL }> {
        const url: URL = await this.twitchService.login();
        return {url: url};
    }

    @Get("oauth/callback")
    public async oauthCallback(@Query() code: string): Promise<void> {
        await this.twitchService.oauthCallback(code);
    }

}
