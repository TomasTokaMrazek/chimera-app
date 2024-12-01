import {Module} from "@nestjs/common";
import {HttpModule} from "@nestjs/axios";

import {TwitchModule} from "@chimera/twitch/module";

import {StreamElementsController} from "@chimera/streamelements/controller";
import {StreamElementsService} from "@chimera/streamelements/service";
import {StreamElementsSocketClientManager} from "@chimera/streamelements/client/socket/manager";
import {StreamElementsRepository} from "@chimera/streamelements/repository/repository";

@Module({
    imports: [HttpModule, TwitchModule],
    controllers: [StreamElementsController],
    providers: [StreamElementsService, StreamElementsSocketClientManager, StreamElementsRepository],
    exports: [StreamElementsService, StreamElementsSocketClientManager, StreamElementsRepository]
})
export class StreamElementsModule {}
