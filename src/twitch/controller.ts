import {Controller, Get, Query, Redirect} from "@nestjs/common";

import {TwitchService} from "./service";

@Controller("twitch")
export class TwitchController {

    constructor(
        private readonly twitchService: TwitchService
    ) {}

    @Redirect()
    @Get("authorize")
    async authorize(@Query("scope") scope: string): Promise<{ url: URL }> {
        const url: URL = await this.twitchService.authorize(scope);
        return {url: url};
    }

    @Get("oauth/callback")
    async oauthCallback(@Query("code") code: string): Promise<void> {
        await this.twitchService.oauthCallback(code);
    }

}
