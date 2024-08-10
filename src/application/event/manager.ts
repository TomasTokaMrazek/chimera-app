import {AxiosResponse} from "@chimera/axios";

import applicationEventRepository from "./repository";
import {EventSynchronization, User} from "@prisma/client";

import streamElementsService from "@chimera/streamelements/service";
import StreamElementsHttpClient from "@chimera/streamelements/client/http/client";
import {CurrentUserChannel, TipRequest} from "@chimera/streamelements/client/http/dto";

import {EventSyncService, EventSyncServiceType} from "./dto";

class ApplicationEventManager {

    public async syncDonations(origin: EventSyncServiceType, user: User, donation: Donation): Promise<void[]> {

        const eventSynchronizations: EventSynchronization[] = await applicationEventRepository.getByFrom(user.id, origin);

        return Promise.all(eventSynchronizations.map(async (eventSynchronization: EventSynchronization): Promise<void> => {
            switch (eventSynchronization.to) {
                case EventSyncService.enum.STREAMELEMENTS: {
                    const streamElementsHttpClient: StreamElementsHttpClient = await streamElementsService.getHttpClient(user.id);

                    const currentUserChannelResponse: AxiosResponse<CurrentUserChannel> = await streamElementsHttpClient.getCurrentUserChannel();

                    const tipRequest: TipRequest = {
                        user: {
                            username: donation.username
                        },
                        provider: "streamlabs",
                        message: donation.message,
                        amount: donation.amount,
                        currency: donation.currency,
                        imported: true
                    };

                    await streamElementsHttpClient.createTip(currentUserChannelResponse.data._id, tipRequest);
                    break;
                }
                case EventSyncService.enum.STREAMLABS: {
                    throw Error("Not implemented.");
                }
            }
        }));
    }

}

export interface Donation {
    username: string;
    email?: string;
    currency: string;
    amount: number;
    message?: string;
}

export default new ApplicationEventManager();
