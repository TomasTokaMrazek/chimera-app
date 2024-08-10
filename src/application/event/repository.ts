import prisma from "@chimera/prisma";
import {EventSynchronization} from "@prisma/client";
import {EventSyncServiceType} from "./dto";

class ApplicationEventRepository {

    public async get(userId: number): Promise<EventSynchronization[]> {
        return prisma.eventSynchronization
            .findMany({
                where: {
                    user_id: userId
                }
            });
    }

    public async getByFrom(userId: number, from: EventSyncServiceType): Promise<EventSynchronization[]> {
        return prisma.eventSynchronization
            .findMany({
                where: {
                    user_id: userId,
                    from: from
                }
            });
    }

    public async create(userId: number, from: EventSyncServiceType, to: EventSyncServiceType): Promise<EventSynchronization> {
        return prisma.eventSynchronization
            .create({
                data: {
                    user_id: userId,
                    from: from,
                    to: to
                }
            });
    }

    public async delete(userId: number, from: EventSyncServiceType, to: EventSyncServiceType): Promise<EventSynchronization> {
        return prisma.eventSynchronization
            .delete({
                where: {
                    user_id_from_to: {
                        user_id: userId,
                        from: from,
                        to: to
                    }
                }
            });
    }

}

export {EventSynchronization};

export default new ApplicationEventRepository();
