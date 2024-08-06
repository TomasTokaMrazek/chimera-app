import {NextFunction, Request, Response} from "express";

import chatbotService from "./service";

class ChatbotController {

    public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const url: URL = await chatbotService.login();
            res.redirect(url.toString());
        } catch (error) {
            next(error);
        }
    }

    public async oauthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authorizationCode: string = req.query.code as string;
            await chatbotService.oauthCallback(authorizationCode);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    public async connect(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await chatbotService.connect();
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    public async disconnect(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await chatbotService.disconnect();
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }


}

export default new ChatbotController();
