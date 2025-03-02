import {Module} from "@nestjs/common";
import {HttpModule} from "@nestjs/axios";

import {TwitchModule} from "@chimera/twitch/module";

import {AgraelusController} from "@chimera/application/agraelus/controller";
import {AgraelusService} from "@chimera/application/agraelus/service";
import {UtilsModule} from "@chimera/application/utils/module";
import {CommandModule} from "@chimera/application/command/module";

@Module({
    imports: [HttpModule, UtilsModule, CommandModule, TwitchModule],
    controllers: [AgraelusController],
    providers: [AgraelusService],
    exports: [AgraelusService]
})
export class AgraelusModule {}
