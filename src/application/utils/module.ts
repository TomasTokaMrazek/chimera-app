import {Module} from "@nestjs/common";

import {HttpModule} from "@nestjs/axios";

import {CurrencyService} from "@chimera/application/utils/currency/service";
import {WheelService} from "@chimera/application/utils/wheel/service";

@Module({
    imports: [HttpModule],
    providers: [CurrencyService, WheelService],
    exports: [CurrencyService, WheelService]
})
export class UtilsModule {}
