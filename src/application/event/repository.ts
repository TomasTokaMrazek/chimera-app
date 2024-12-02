import {Injectable} from "@nestjs/common";

import {PrismaService} from "@chimera/prisma/service";
import {EventSynchronization} from "@chimera/prisma/client";

import {EventSyncServiceType} from "./dto";

@Injectable()
export class ApplicationEventRepository {

    constructor(
        private readonly prisma: PrismaService
    ) {}

    public async get(userId: number): Promise<EventSynchronization[]> {
        return this.prisma.eventSynchronization
            .findMany({
                where: {
                    user_id: userId
                }
            });
    }

    public async getByFrom(userId: number, from: EventSyncServiceType): Promise<EventSynchronization[]> {
        return this.prisma.eventSynchronization
            .findMany({
                where: {
                    user_id: userId,
                    from: from
                }
            });
    }

    public async create(userId: number, from: EventSyncServiceType, to: EventSyncServiceType): Promise<EventSynchronization> {
        return this.prisma.eventSynchronization
            .create({
                data: {
                    user_id: userId,
                    from: from,
                    to: to
                }
            });
    }

    public async delete(userId: number, from: EventSyncServiceType, to: EventSyncServiceType): Promise<EventSynchronization> {
        return this.prisma.eventSynchronization
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
