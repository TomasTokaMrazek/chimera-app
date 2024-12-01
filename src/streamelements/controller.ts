import {Controller, Get, Query} from "@nestjs/common";

import {StreamElementsService} from "./service";

@Controller("streamelements")
export class StreamElementsController {

    constructor(
        private readonly streamElementsService: StreamElementsService
    ) {}

    @Get("authorize")
    public async authorize(@Query() jwt: string): Promise<void> {
        await this.streamElementsService.authorize(jwt);
    }

}
