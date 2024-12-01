import {Module} from "@nestjs/common";
import {HttpModule} from "@nestjs/axios";

import {TwitchModule} from "@chimera/twitch/module";
import {ApplicationEventModule} from "@chimera/application/event/module";

import {StreamLabsController} from "@chimera/streamlabs/controller";
import {StreamLabsService} from "@chimera/streamlabs/service";
import {StreamLabsSocketClientManager} from "@chimera/streamlabs/client/socket/manager";
import {StreamLabsRepository} from "@chimera/streamlabs/repository/repository";

@Module({
    imports: [HttpModule, TwitchModule, ApplicationEventModule],
    controllers: [StreamLabsController],
    providers: [StreamLabsService, StreamLabsSocketClientManager, StreamLabsRepository],
    exports: [StreamLabsService, StreamLabsSocketClientManager]
})
export class StreamLabsModule {}
