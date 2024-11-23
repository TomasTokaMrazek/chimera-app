import {Controller, Get, Query} from "@nestjs/common";

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

}
