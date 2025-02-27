import {Body, Controller, Get, Post, Query} from "@nestjs/common";

import {EventSynchronization} from "@chimera/prisma/client";

import {ApplicationEventService} from "./service";
import {EventSyncRequestDto} from "./dto";

@Controller("application/event")
export class ApplicationEventController {

    constructor(
        private readonly eventService: ApplicationEventService
    ) {}

    @Post("enable")
    async enable(@Body() body: EventSyncRequestDto): Promise<void> {
        await this.eventService.enable(body);
    }

    @Post("disable")
    async disable(@Body() body: EventSyncRequestDto): Promise<void> {
        await this.eventService.disable(body);
    }

    @Get("get")
    async get(@Query("twitchAccountId") twitchAccountId: string): Promise<EventSynchronization[]> {
        return await this.eventService.get(twitchAccountId);
    }

}
