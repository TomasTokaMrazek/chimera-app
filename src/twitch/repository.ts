import prisma from "../prisma";
import {IdView, UserView} from "../views";

class TwitchRepository {

    public async getUser(accountId: string): Promise<UserView> {
        return prisma.twitch
            .findUniqueOrThrow({
                where: {
                    account_id: accountId
                },
                select: {
                    user: true
                }
            });
    }

    public async getOrInsertTwitchId(accountId: string): Promise<IdView> {
        return prisma.twitch
            .upsert({
                where: {
                    account_id: accountId
                },
                create: {
                    account_id: accountId,
                    user: {
                        create: {}
                    }
                },
                update: {},
                select: {
                    id: true
                }
            });
    }

}

export default new TwitchRepository();
