import prisma from "../prisma";
import {IdView} from "../views";

class TwitchService {

    private static instance: TwitchService = new TwitchService();

    private constructor() {

    }

    public static getInstance(): TwitchService {
        return TwitchService.instance;
    }

    public async getTwitchId(accountId: string): Promise<IdView> {
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

export default TwitchService.getInstance();
