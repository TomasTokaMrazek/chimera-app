import {NextFunction, Request, Response} from "express";

import twitchService from "./service";

class TwitchController {

    public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const url: URL = await twitchService.login();
            res.redirect(url.toString());
        } catch (error) {
            next(error);
        }
    }

    public async oauthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authorizationCode: string = req.query.code as string;
            await twitchService.oauthCallback(authorizationCode);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

}

export default new TwitchController();
