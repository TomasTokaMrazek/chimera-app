import {Controller} from "@nestjs/common";

import {ApplicationAgraelusService} from "./service";

@Controller("application/agraelus")
export class ApplicationAgraelusController {

    constructor(
        private readonly agraelusService: ApplicationAgraelusService
    ) {}

}
