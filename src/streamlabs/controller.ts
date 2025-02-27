import {Controller, Get, Query, Redirect} from "@nestjs/common";

import {StreamLabsService} from "./service";

@Controller("streamlabs")
export class StreamLabsController {

    constructor(
        private readonly streamLabsService: StreamLabsService
    ) {}

    @Redirect()
    @Get("authorize")
    async authorize(@Query("scope") scope: string): Promise<{ url: URL }> {
        const url: URL = await this.streamLabsService.authorize(scope);
        return {url: url};
    }

    @Get("oauth/callback")
    public async oauthCallback(@Query("code") code: string): Promise<void> {
        await this.streamLabsService.oauthCallback(code);
    }

}
