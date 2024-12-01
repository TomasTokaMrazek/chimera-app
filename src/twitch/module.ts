import {Module} from "@nestjs/common";
import {HttpModule} from "@nestjs/axios";

import {TwitchController} from "./controller";
import {TwitchService} from "./service";
import {TwitchRepository} from "./repository/repository"

@Module({
    imports: [HttpModule],
    controllers: [TwitchController],
    providers: [TwitchService, TwitchRepository],
    exports: [TwitchService, TwitchRepository]
})
export class TwitchModule {}
