import {Controller, Get, Req, Res, Next} from "@nestjs/common";

import {Request, Response, NextFunction} from "express";

@Controller()
export class AppController {

    @Get("success")
    public async success(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction): Promise<void> {
        try {
            res.send("Success!");
        } catch (error) {
            next(error);
        }
    }

}
