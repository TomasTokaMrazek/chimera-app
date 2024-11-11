import {Module} from "@nestjs/common";

import {ApplicationAgraelusController} from "@chimera/application/agraelus/controller";
import {ApplicationAgraelusService} from "@chimera/application/agraelus/service";

import {TwitchModule} from "@chimera/twitch/module";

@Module({
    imports: [TwitchModule],
    controllers: [ApplicationAgraelusController],
    providers: [ApplicationAgraelusService],
    exports: [ApplicationAgraelusService]
})
export class ApplicationAgraelusModule {}
