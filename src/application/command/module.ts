import {Module} from "@nestjs/common";
import {HttpModule} from "@nestjs/axios";

import {UtilsModule} from "@chimera/application/utils/module";
import {TwitchModule} from "@chimera/twitch/module";
import {StreamElementsModule} from "@chimera/streamelements/module";

import {CommandService} from "@chimera/application/command/service";
import {RaffleService} from "@chimera/application/command/model/raffle";

@Module({
    imports: [HttpModule, UtilsModule, TwitchModule, StreamElementsModule],
    providers: [CommandService, RaffleService],
    exports: [CommandService, RaffleService]
})
export class CommandModule {}
