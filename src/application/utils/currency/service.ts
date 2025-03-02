import {Injectable, Logger} from "@nestjs/common";
import {HttpService} from "@nestjs/axios";

import {AxiosResponse} from "axios";
import {lastValueFrom} from "rxjs";

const CURRENCY_EXCHANGE_RATE_URL = "https://data.kurzy.cz/json/meny/b[6].json";

@Injectable()
export class CurrencyService {

    private readonly logger: Logger = new Logger(CurrencyService.name);

    constructor(
        private readonly httpService: HttpService
    ) {}

    async currencyRate(target: string): Promise<number> {
        const response: AxiosResponse<any> = await lastValueFrom(this.httpService.get(CURRENCY_EXCHANGE_RATE_URL));
        const currencyRates: any = response.data;
        if (currencyRates?.kurzy[target]) {
            return currencyRates.kurzy[target].dev_stred;
        } else {
            throw new Error(`Currency rate for ${target} was not found.`);
        }
    }

}
