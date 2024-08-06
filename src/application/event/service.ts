import {EventSyncRequestType} from "./dto";
import {UserView} from "../../views";

import {EventSynchronization, User} from "@prisma/client";
import applicationEventRepository from "./repository";
import twitchRepository from "../../twitch/repository";

class ApplicationEventService {

    public async enable(request: EventSyncRequestType): Promise<void> {
        const userView: UserView = await twitchRepository.getUserByAccountId(request.twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${request.twitchAccountId}' is not associated with User.`);
        })();
        await applicationEventRepository.create(user.id, request.sync.from, request.sync.to);
    }

    public async disable(request: EventSyncRequestType): Promise<void> {
        const userView: UserView = await twitchRepository.getUserByAccountId(request.twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${request.twitchAccountId}' is not associated with User.`);
        })();
        await applicationEventRepository.delete(user.id, request.sync.from, request.sync.to);
    }

    public async get(twitchAccountId: string): Promise<EventSynchronization[]> {
        const userView: UserView = await twitchRepository.getUserByAccountId(twitchAccountId);
        const user: User = userView.user ?? ((): User => {
            throw new Error(`Twitch Account '${twitchAccountId}' is not associated with User.`);
        })();
        return await applicationEventRepository.get(user.id);
    }

}

export default new ApplicationEventService();
