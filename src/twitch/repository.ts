import prisma from "../prisma";
import {IdView} from "../views";

class TwitchRepository {

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
