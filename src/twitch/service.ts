import prisma from "../prisma";

class TwitchService {

    private static instance: TwitchService = new TwitchService();

    private constructor() {

    }

    public static getInstance(): TwitchService {
        return TwitchService.instance;
    }

    public async getTwitchId(accountId: string) {
        return prisma.twitch
            .upsert({
                where: {
                    account_id: accountId
                },
                create: {
                    account_id: accountId,
                    user: {
                        create: {

                        }
                    }
                },
                update: {

                },
                select: {
                    id: true
                }
            });
    }

    public async getUser(accountId: string) {
        return prisma.twitch
            .findUnique({
                where: {
                    account_id: accountId
                },
                select: {
                    user: true
                }
            })
    }

}

export default TwitchService.getInstance();
