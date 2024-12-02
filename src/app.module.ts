import {Logger, Module, OnModuleInit} from "@nestjs/common";
import {HttpModule, HttpService} from "@nestjs/axios";
import {ScheduleModule} from "@nestjs/schedule";
import {EventEmitterModule} from "@nestjs/event-emitter";
import {APP_PIPE} from "@nestjs/core";

import {ZodValidationPipe} from "nestjs-zod";

import {PrismaModule} from "@chimera/prisma/module";
import {TwitchModule} from "@chimera/twitch/module";
import {StreamElementsModule} from "@chimera/streamelements/module";
import {StreamLabsModule} from "@chimera/streamlabs/module";
import {ApplicationChatbotModule} from "@chimera/application/chatbot/module";
import {ApplicationEventModule} from "@chimera/application/event/module";
import {ApplicationAgraelusModule} from "@chimera/application/agraelus/module";
import {ApplicationFlygunModule} from "@chimera/application/flygun/module";

import {Axios, AxiosResponse, InternalAxiosRequestConfig} from "axios";

@Module({
    imports: [
        HttpModule,
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot({
            wildcard: true
        }),
        PrismaModule,
        TwitchModule,
        StreamElementsModule,
        StreamLabsModule,
        ApplicationChatbotModule,
        ApplicationEventModule,
        ApplicationAgraelusModule,
        ApplicationFlygunModule
    ],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe
        }
    ]
})
export class AppModule implements OnModuleInit {

    constructor(
        private readonly httpService: HttpService
    ) {}

    onModuleInit(): any {
        const logger: Logger = new Logger(Axios.name);

        this.httpService.axiosRef.interceptors.request.use(async (request: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
            const message: {} = {
                "url": request.url,
                "method": request.method,
                "headers": request.headers,
                "data": request.data,
                "params": request.params
            };

            logger.log(`Request: ${JSON.stringify(message, null, 2)}`);
            return request;
        });

        this.httpService.axiosRef.interceptors.response.use(async (response: AxiosResponse): Promise<AxiosResponse> => {
            const message: {} = {
                "status": response.status,
                "headers": response.headers,
                "data": response.data
            };

            logger.log(`Response: ${JSON.stringify(message, null, 2)}`);
            return response;
        });
    }

}
