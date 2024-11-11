import {Module} from "@nestjs/common";

import {ApplicationEventController} from "@chimera/application/event/controller";
import {ApplicationEventService} from "@chimera/application/event/service";
import {ApplicationEventManager} from "@chimera/application/event/manager";
import {ApplicationEventRepository} from "@chimera/application/event/repository"

import {TwitchModule} from "@chimera/twitch/module";
import {StreamElementsModule} from "@chimera/streamelements/module";

@Module({
    imports: [TwitchModule, StreamElementsModule],
    controllers: [ApplicationEventController],
    providers: [ApplicationEventService, ApplicationEventManager, ApplicationEventRepository],
    exports: [ApplicationEventService, ApplicationEventManager]
})
export class ApplicationEventModule {}
