import {Module} from "@nestjs/common";

import {HttpModule} from "@nestjs/axios";

import {StreamElementsController} from "@chimera/streamelements/controller";
import {StreamElementsService} from "@chimera/streamelements/service";
import {StreamElementsRepository} from "@chimera/streamelements/repository/repository";

import {TwitchModule} from "@chimera/twitch/module";

@Module({
    imports: [HttpModule, TwitchModule],
    controllers: [StreamElementsController],
    providers: [StreamElementsService, StreamElementsRepository],
    exports: [StreamElementsService]
})
export class StreamElementsModule {}
