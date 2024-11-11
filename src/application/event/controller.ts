import {Controller, Post, Get, Req, Res, Next} from "@nestjs/common";

import {NextFunction, Request, Response} from "express";

import {ApplicationEventService} from "./service";
import {EventSyncRequestType} from "./dto";
import {EventSynchronization} from "@prisma/client";

@Controller("application/events")
export class ApplicationEventController {

    constructor(
        private readonly eventService: ApplicationEventService
    ) {}

    @Post("enable")
    public async enable(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const body: EventSyncRequestType = req.body;
            await this.eventService.enable(body);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    @Post("disable")
    public async disable(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const body: EventSyncRequestType = req.body;
            await this.eventService.disable(body);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    @Get("get")
    public async get(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const twitchAccountId: string = req.query.twitchAccountId as string;
            const eventSynchronizations: EventSynchronization[] = await this.eventService.get(twitchAccountId);
            res.status(200).send(eventSynchronizations);
        } catch (error) {
            next(error);
        }
    }

}
