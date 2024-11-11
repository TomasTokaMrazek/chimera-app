import {Module} from "@nestjs/common";

import {StreamLabsController} from "@chimera/streamlabs/controller";
import {StreamLabsService} from "@chimera/streamlabs/service";
import {StreamLabsRepository} from "@chimera/streamlabs/repository/repository";

import {TwitchModule} from "@chimera/twitch/module";
import {ApplicationEventModule} from "@chimera/application/event/module";

@Module({
    imports: [TwitchModule, ApplicationEventModule],
    controllers: [StreamLabsController],
    providers: [StreamLabsService, StreamLabsRepository],
    exports: [StreamLabsService]
})
export class StreamLabsModule {}
