import {Controller, Get, Req, Res, Next} from "@nestjs/common";

import {Request, Response, NextFunction} from "express";

import {TwitchService} from "./service";

@Controller("twitch")
export class TwitchController {

    constructor(
        private readonly twitchService: TwitchService
    ) {}

    @Get("login")
    public async login(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const url: URL = await this.twitchService.login();
            res.redirect(url.toString());
        } catch (error) {
            next(error);
        }
    }

    @Get("oauth/callback")
    public async oauthCallback(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const authorizationCode: string = req.query.code as string;
            await this.twitchService.oauthCallback(authorizationCode);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

}
