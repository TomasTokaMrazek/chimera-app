import prisma from "../prisma";
import {IdView} from "../views";

class TwitchRepository {

    private static instance: TwitchRepository = new TwitchRepository();

    private constructor() {

    }

    public static getInstance(): TwitchRepository {
        return TwitchRepository.instance;
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

export default TwitchRepository.getInstance();
