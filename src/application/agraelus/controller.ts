import {Controller, Get, Next, Post, Req, Res} from "@nestjs/common";

import {NextFunction, Request, Response} from "express";

import {ApplicationAgraelusService} from "./service";

@Controller("application/agraelus")
export class ApplicationAgraelusController {

    constructor(
        private readonly agraelusService: ApplicationAgraelusService
    ) {}

    @Post("connect")
    public async connect(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            await this.agraelusService.connect();
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

    @Post("disconnect")
    public async disconnect(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            await this.agraelusService.disconnect();
            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }

}
