import {Body, Controller, Get, Post, Query} from "@nestjs/common";

import {StreamElementsService} from "./service";

@Controller("streamelements")
export class StreamElementsController {

    constructor(
        private readonly streamElementsService: StreamElementsService
    ) {}

    @Get("login")
    public async login(@Query() jwt: string): Promise<void> {
        await this.streamElementsService.login(jwt);
    }

    @Post("connect")
    public async connect(@Body() body: { accountId: string }): Promise<void> {
        const accountId: string = body.accountId;
        await this.streamElementsService.connect(accountId);
    }

}
