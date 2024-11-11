import {Module} from "@nestjs/common";

import {HttpModule} from "@nestjs/axios";

import {TwitchController} from "@chimera/twitch/controller";
import {TwitchService} from "@chimera/twitch/service";
import {TwitchHttpClientManager} from "@chimera/twitch/client/http/manager";
import {TwitchSocketClientManager} from "@chimera/twitch/client/socket/manager";
import {TwitchRepository} from "@chimera/twitch/repository/repository"

@Module({
    imports: [HttpModule],
    controllers: [TwitchController],
    providers: [TwitchRepository, TwitchService, TwitchHttpClientManager, TwitchSocketClientManager],
    exports: [TwitchRepository, TwitchService, TwitchHttpClientManager, TwitchSocketClientManager]
})
export class TwitchModule {}
