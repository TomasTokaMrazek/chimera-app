import {Injectable, Logger} from "@nestjs/common";
import {HttpService} from "@nestjs/axios";

import {AxiosResponse} from "axios";
import {format} from "date-fns";
import {cs} from "date-fns/locale";

import WheelOfNamesClient from "@chimera/application/utils/wheel/client";
import * as Wheel from "@chimera/application/utils/wheel/dto";

import {RaffleUser} from "@chimera/application/command/model/raffle";

import configuration from "@chimera/configuration";
import {ApiClient} from "@twurple/api";

const wheelOfNamesUrl: string = configuration.app.wheelOfNames.url;

@Injectable()
export class WheelService {

    private readonly logger: Logger = new Logger(WheelService.name);

    constructor(
        private readonly httpService: HttpService
    ) {}

    async generate(displayName: string, profilePictureUrl: string, users: RaffleUser[]): Promise<string> {
        const entries: Wheel.Entry[] = users.map((user: RaffleUser): Wheel.Entry => {
            return {
                text: user.username,
                color: user.color ?? undefined,
                weight: 1
            };
        });

        const body: Wheel.PostRequest = {
            wheelConfig: {
                description: format(new Date(), "EEEE, d MMMM yyyy", {locale: cs}),
                title: displayName,
                type: Wheel.Type.COLOR,
                spinTime: 5,
                hubSize: Wheel.HubSize.L,
                entries: entries,
                isAdvanced: true,
                customPictureDataUri: profilePictureUrl,
                pictureType: Wheel.PictureType.UPLOADED,
                allowDuplicates: true
            },
            shareMode: Wheel.ShareMode.COPYABLE
        };

        const wheelOfNamesClient: WheelOfNamesClient = WheelOfNamesClient.createInstance(this.httpService);
        const response: AxiosResponse<Wheel.PostResponse> = await wheelOfNamesClient.createSharedWheel(body);
        if (response.status !== 200) {
            throw new Error("Unable to create Wheel Of Names.");
        }

        const path: string = response.data.data.path;

        return wheelOfNamesUrl.concat("/").concat(path);
    }

}
