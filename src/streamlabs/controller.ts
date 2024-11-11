import {Controller, Get, Post, Req, Res, Next} from "@nestjs/common";

import {NextFunction, Request, Response} from "express";

import {StreamLabsService} from "./service";

@Controller("streamlabs")
export class StreamLabsController {

    constructor(
        private readonly streamLabsService: StreamLabsService
    ) {}

    @Get("login")
    public async login(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const url: URL = await this.streamLabsService.login();
            res.redirect(url.toString());
        } catch (error) {
            next(error);
        }
    }

    @Get("oauth/callback")
    public async oauthCallback(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const authorizationCode: string = req.query.code as string;
            await this.streamLabsService.oauthCallback(authorizationCode);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    @Post("connect")
    public async connect(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const twitchAccountId: string = req.body.twitchAccountId as string;
            await this.streamLabsService.connect(twitchAccountId);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }
}
