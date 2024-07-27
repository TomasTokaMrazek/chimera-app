import {NextFunction, Request, Response} from "express";

import eventService from "./service";
import {EventSyncRequestType} from "./dto";
import {EventSynchronization} from "@prisma/client";

class EventController {

    public async enable(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const body: EventSyncRequestType = req.body;
            await eventService.enable(body);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    public async disable(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const body: EventSyncRequestType = req.body;
            await eventService.disable(body);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    public async get(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const twitchAccountId: string = req.query.twitchAccountId as string;
            const eventSynchronizations: EventSynchronization[] = await eventService.get(twitchAccountId);
            res.status(200).send(eventSynchronizations);
        } catch (error) {
            next(error);
        }
    }

}

export default new EventController();
