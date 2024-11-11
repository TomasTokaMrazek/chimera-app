import {Controller, Get, Next, Post, Req, Res} from "@nestjs/common";

import {NextFunction, Request, Response} from "express";

import {ApplicationChatbotService} from "./service";

@Controller("application/chatbot")
export class ApplicationChatbotController {

    constructor(
        private readonly chatbotService: ApplicationChatbotService
    ) {}

    @Get("login")
    public async login(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const url: URL = await this.chatbotService.login();
            res.redirect(url.toString());
        } catch (error) {
            next(error);
        }
    }

    @Get("oauth/callback")
    public async oauthCallback(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            const authorizationCode: string = req.query.code as string;
            await this.chatbotService.oauthCallback(authorizationCode);
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    @Post("connect")
    public async connect(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            await this.chatbotService.connect();
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    @Post("disconnect")
    public async disconnect(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            await this.chatbotService.disconnect();
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

}
