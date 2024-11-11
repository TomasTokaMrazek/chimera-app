import {Injectable} from '@nestjs/common';

import {EventSyncRequestType} from "./dto";

import {EventSynchronization, User} from "@prisma/client";

import {TwitchRepository} from "@chimera/twitch/repository/repository";
import {UserView} from "@chimera/twitch/repository/views";

import {ApplicationEventRepository} from "./repository";

@Injectable()
export class ApplicationEventService {

    constructor(
        private readonly applicationEventRepository: ApplicationEventRepository,
        private readonly twitchRepository: TwitchRepository
    ) {}

    public async enable(request: EventSyncRequestType): Promise<void> {
        const userView: UserView = await this.twitchRepository.getUserByAccountId(request.twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${request.twitchAccountId}' is not associated with User.`);
        })();
        await this.applicationEventRepository.create(user.id, request.sync.from, request.sync.to);
    }

    public async disable(request: EventSyncRequestType): Promise<void> {
        const userView: UserView = await this.twitchRepository.getUserByAccountId(request.twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${request.twitchAccountId}' is not associated with User.`);
        })();
        await this.applicationEventRepository.delete(user.id, request.sync.from, request.sync.to);
    }

    public async get(twitchAccountId: string): Promise<EventSynchronization[]> {
        const userView: UserView = await this.twitchRepository.getUserByAccountId(twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with User.`);
        })();
        return await this.applicationEventRepository.get(user.id);
    }

}
