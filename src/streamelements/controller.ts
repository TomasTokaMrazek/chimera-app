import {Controller, Get, Post, Req, Res, Next} from "@nestjs/common";

import {NextFunction, Request, Response} from "express";

import {StreamElementsService} from "./service";

@Controller("streamelements")
export class StreamElementsController {

    constructor(
        private readonly streamElementsService: StreamElementsService
    ) {}

    @Get("login")
    public async login(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const jwt: string = req.query.jwt as string;
            await this.streamElementsService.login(jwt);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    @Post("connect")
    public async connect(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const twitchAccountId: string = req.body.twitchAccountId as string;
            await this.streamElementsService.connect(twitchAccountId);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

}
