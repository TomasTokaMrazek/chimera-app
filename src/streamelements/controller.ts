import {Controller, Get, Query} from "@nestjs/common";

import {StreamElementsService} from "./service";

@Controller("streamelements")
export class StreamElementsController {

    constructor(
        private readonly streamElementsService: StreamElementsService
    ) {}

    @Get("authorize")
    async authorize(@Query("jwt") jwt: string): Promise<void> {
        await this.streamElementsService.authorize(jwt);
    }

}
