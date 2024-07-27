import {NextFunction, Request, Response} from "express";

import streamLabsService from "./service";

class StreamLabsController {

    public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const url: URL = await streamLabsService.login();
            res.redirect(url.toString());
        } catch (error) {
            next(error);
        }
    }

    public async oauthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authorizationCode: string = req.query.code as string;
            await streamLabsService.oauthCallback(authorizationCode);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    public async connect(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const twitchAccountId: string = req.body.twitchAccountId as string;
            await streamLabsService.connect(twitchAccountId);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }
}

export default new StreamLabsController();
