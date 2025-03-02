import {Controller} from "@nestjs/common";

import {AgraelusService} from "./service";

@Controller("application/agraelus")
export class AgraelusController {

    constructor(
        private readonly agraelusService: AgraelusService
    ) {}

}
