import {Module} from "@nestjs/common";

import {StreamElementsController} from "@chimera/streamelements/controller";
import {StreamElementsService} from "@chimera/streamelements/service";
import {StreamElementsRepository} from "@chimera/streamelements/repository/repository";

import {TwitchModule} from "@chimera/twitch/module";

@Module({
    imports: [TwitchModule],
    controllers: [StreamElementsController],
    providers: [StreamElementsService, StreamElementsRepository],
    exports: [StreamElementsService]
})
export class StreamElementsModule {}
