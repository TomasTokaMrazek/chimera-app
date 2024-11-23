import {Module} from "@nestjs/common";

import {HttpModule} from "@nestjs/axios";
import {StreamElementsModule} from "@chimera/streamelements/module";

import {ApplicationFlygunService} from "@chimera/application/flygun/service";

@Module({
    imports: [HttpModule, StreamElementsModule],
    providers: [ApplicationFlygunService],
    exports: [ApplicationFlygunService]
})
export class ApplicationFlygunModule {}
