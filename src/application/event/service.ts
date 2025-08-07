import {Injectable, Logger} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";
import {AxiosResponse} from "axios";

import {EventSynchronization, User} from "@chimera/prisma/client";

import {TwitchRepository} from "@chimera/twitch/repository/repository";
import {UserView} from "@chimera/twitch/repository/views";

import {StreamElementsService} from "@chimera/streamelements/service";
import {StreamElementsRepository} from "@chimera/streamelements/repository/repository";
import {StreamElementsHttpClient} from "@chimera/streamelements/client/http/client";
import {CurrentUserChannel, TipRequest} from "@chimera/streamelements/client/http/dto";

import * as Dto from "@chimera/streamlabs/client/socket/dto";

import {ApplicationEventRepository} from "./repository";
import {EventSyncRequestDto, EventSyncService, EventSyncServiceType} from "./dto";

@Injectable()
export class ApplicationEventService {

    private readonly logger: Logger = new Logger(ApplicationEventService.name);

    constructor(
        private readonly streamElementsService: StreamElementsService,
        private readonly streamElementsRepository: StreamElementsRepository,
        private readonly applicationEventRepository: ApplicationEventRepository,
        private readonly twitchRepository: TwitchRepository
    ) {}

    async enable(request: EventSyncRequestDto): Promise<void> {
        const userView: UserView = await this.twitchRepository.getUserByAccountId(request.twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${request.twitchAccountId}' is not associated with User.`);
        })();
        await this.applicationEventRepository.create(user.id, request.sync.from, request.sync.to);
    }

    async disable(request: EventSyncRequestDto): Promise<void> {
        const userView: UserView = await this.twitchRepository.getUserByAccountId(request.twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${request.twitchAccountId}' is not associated with User.`);
        })();
        await this.applicationEventRepository.delete(user.id, request.sync.from, request.sync.to);
    }

    async get(twitchAccountId: string): Promise<EventSynchronization[]> {
        const userView: UserView = await this.twitchRepository.getUserByAccountId(twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with User.`);
        })();
        return await this.applicationEventRepository.get(user.id);
    }

    @OnEvent("streamlabs.event")
    async socketEvent(event: Dto.TipEvent, accountId: string): Promise<void> {
        switch (event.type) {
            case "donation": {
                Promise.all(event.message.map(async (message: Dto.TipEventMessage): Promise<void[]> => {
                    const donation: Donation = {
                        username: message.name,
                        message: message.message,
                        currency: message.currency,
                        amount: message.amount
                    };

                    return await this.syncDonations(EventSyncService.enum.STREAMLABS, accountId, donation);
                })).catch(error => {
                    this.logger.error(`[StreamLabs] Error processing event.`, error);
                });
                break;
            }
        }
    }

    private async syncDonations(origin: EventSyncServiceType, accountId: string, donation: Donation): Promise<void[]> {
        const userView: UserView = await this.streamElementsRepository.getUserByAccountId(accountId)
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Account ID '${accountId}' is not associated with User.`);
        })();

        const eventSynchronizations: EventSynchronization[] = await this.applicationEventRepository.getByFrom(user.id, origin);

        return Promise.all(eventSynchronizations.map(async (eventSynchronization: EventSynchronization): Promise<void> => {
            switch (eventSynchronization.to) {
                case EventSyncService.enum.STREAMELEMENTS: {
                    const streamElementsId: number = user.streamelements_id ?? ((): number => {
                        throw new Error(`User ID '${user.id}' does not have Stream Elements ID.`);
                    })();
                    const streamElementsHttpClient: StreamElementsHttpClient = await this.streamElementsService.getHttpClient(accountId);

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

interface Donation {
    username: string;
    email?: string;
    currency: string;
    amount: number;
    message?: string;
}
