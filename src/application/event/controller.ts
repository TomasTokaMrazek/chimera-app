import {Body, Controller, Get, Post, Query} from "@nestjs/common";

import {ApplicationEventService} from "./service";
import {EventSyncRequestDto} from "./dto";
import {EventSynchronization} from "@prisma/client";

@Controller("application/event")
export class ApplicationEventController {

    constructor(
        private readonly eventService: ApplicationEventService
    ) {}

    @Post("enable")
    public async enable(@Body() body: EventSyncRequestDto): Promise<void> {
        await this.eventService.enable(body);
    }

    @Post("disable")
    public async disable(@Body() body: EventSyncRequestDto): Promise<void> {
        await this.eventService.disable(body);
    }

    @Get("get")
    public async get(@Query() twitchAccountId: string): Promise<EventSynchronization[]> {
        return await this.eventService.get(twitchAccountId);
    }

}
