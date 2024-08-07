import {NextFunction, Request, Response} from "express";

import agraelusService from "./service";

class AgraelusController {

    public async connect(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await agraelusService.connect();
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    public async disconnect(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await agraelusService.disconnect();
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

}

export default new AgraelusController();
