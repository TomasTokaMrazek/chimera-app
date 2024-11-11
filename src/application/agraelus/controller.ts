import {Controller, Post} from "@nestjs/common";

import {ApplicationAgraelusService} from "./service";

@Controller("application/agraelus")
export class ApplicationAgraelusController {

    constructor(
        private readonly agraelusService: ApplicationAgraelusService
    ) {}

    @Post("connect")
    public async connect(): Promise<void> {
        await this.agraelusService.connect();
    }

    @Post("disconnect")
    public async disconnect(): Promise<void> {
        await this.agraelusService.disconnect();
    }

}
