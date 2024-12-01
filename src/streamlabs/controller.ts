import {Controller, Get, Query, Redirect} from "@nestjs/common";

import {StreamLabsService} from "./service";

@Controller("streamlabs")
export class StreamLabsController {

    constructor(
        private readonly streamLabsService: StreamLabsService
    ) {}

    @Redirect()
    @Get("authorize")
    public async authorize(): Promise<{ url: URL }> {
        const url: URL = await this.streamLabsService.authorize();
        return {url: url};
    }

    @Get("oauth/callback")
    public async oauthCallback(@Query() code: string): Promise<void> {
        await this.streamLabsService.oauthCallback(code);
    }

}
