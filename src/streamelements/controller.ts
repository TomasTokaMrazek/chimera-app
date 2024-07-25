import {NextFunction, Request, Response} from "express";

import streamElementsService from "./service";
import {AccountIds} from "./types";

class StreamLabsController {

    public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const jwt: string = req.query.jwt as string;

            const accountIds: AccountIds = await streamElementsService.getAccountIds(jwt);

            await streamElementsService.setTokens(accountIds, jwt);

            await streamElementsService.connectToWebSocket(jwt);

            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

}

export default new StreamLabsController();
