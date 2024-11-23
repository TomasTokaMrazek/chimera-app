import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from "@nestjs/common";
import {HttpService} from "@nestjs/axios";
import {OnEvent} from "@nestjs/event-emitter";

import {lastValueFrom} from "rxjs";
import {AxiosResponse} from "axios"

import * as net from "node:net";

import {StreamElementsSocketClientManager} from "@chimera/streamelements/client/socket/manager";

import configuration from "@chimera/configuration";;

const streamElementsAccountId: string = configuration.app.flygun.streamElementsAccountId;

const PORT = 3001;
const HOST = "0.0.0.0";

const TIP_MULTIPLIER = 2;
const SUBSCRIPTION_GIFT_VALUE = 150;

const CURRENCY_EXCHANGE_RATE_URL = "https://data.kurzy.cz/json/meny/b[6].json";

@Injectable()
export class ApplicationFlygunService implements OnModuleInit, OnModuleDestroy {

    private readonly logger: Logger = new Logger(ApplicationFlygunService.name);

    private readonly queue: Array<[string, number]> = [];

    private readonly server: net.Server = net.createServer((socket: net.Socket): void => {
        this.logger.log(`Client connected.`);
        this.enabled = true;

        socket.on("close", (): void => {
            this.logger.log(`Client disconnected.`);
            this.enabled = false;
        });

        socket.on("data", (data: Buffer): void => {
            this.logger.verbose(`Request: ${data.toString()}`);
            const [id, amount] = this.queue.shift() ?? ["", 0];
            socket.write(`${amount}\n`, (): void => {
                this.logger.verbose(`Response: ${amount}`);
            });
        });

        socket.on("error", (error: Error): void => {
            this.logger.error(`Error: ${error}`);
        });
    });

    private enabled: boolean = false;

    constructor(
        private readonly httpService: HttpService,
        private readonly streamElementsSocketClientManager: StreamElementsSocketClientManager
    ) {}

    async onModuleInit(): Promise<any> {
        this.server.listen(PORT, HOST);
        await this.streamElementsSocketClientManager.createSocketClient(streamElementsAccountId)
            .catch((error: Error): void => this.logger.error(error.message, error.stack));
    }

    async onModuleDestroy(): Promise<any> {
        this.server.close();
        await this.streamElementsSocketClientManager.destroySocketClient(streamElementsAccountId)
            .catch((error: Error): void => this.logger.error(error.message, error.stack));
    }

    @OnEvent("streamelements.event")
    async socketEvent(message: any): Promise<void> {
        if (!this.enabled) {
            return;
        }

        const provider: string = message.provider;
        if (provider !== "twitch") {
            return;
        }

        const id: string = message._id;
        const type: string = message.type;
        switch (type) {
            case "tip": {
                let amount: number = message.data.amount;
                const currency: string = message.data.currency;
                if (currency !== "CZK") {
                    const response: AxiosResponse<any> = await lastValueFrom(this.httpService.get(CURRENCY_EXCHANGE_RATE_URL));
                    const currencyRates: any = response.data;
                    if (currencyRates?.kurzy[currency]) {
                        const currencyRate: number = currencyRates.kurzy[currency].dev_stred;
                        amount = amount * currencyRate;
                    } else {
                        this.logger.error(`Currency rate for ${currency} was not found.`)
                    }
                }
                amount = Math.ceil(-amount * TIP_MULTIPLIER);
                this.queue.push([id, amount]);
                break;
            }
            case "subscriber": {
                let amount: number = Math.ceil(-SUBSCRIPTION_GIFT_VALUE);
                const gifted: boolean = message.data.gifted;
                if (gifted) {
                    this.queue.push([id, amount]);
                }
                break;
            }
        }
    }

}
