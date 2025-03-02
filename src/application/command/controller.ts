import {Controller} from "@nestjs/common";

import {CommandService} from "./service";

@Controller("application/command")
export class CommandController {

    constructor(
        private readonly raffleService: CommandService
    ) {}

}
