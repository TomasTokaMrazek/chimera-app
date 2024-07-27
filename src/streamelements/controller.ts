import {NextFunction, Request, Response} from "express";

import streamElementsService from "./service";

class StreamElementsController {

    public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const jwt: string = req.query.jwt as string;
            await streamElementsService.login(jwt);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    public async connect(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const twitchAccountId: string = req.body.twitchAccountId as string;
            await streamElementsService.connect(twitchAccountId);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

}

export default new StreamElementsController();
