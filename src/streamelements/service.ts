import prisma from "../prisma";

class StreamElementsService {

    private static instance: StreamElementsService = new StreamElementsService();

    private constructor() {

    }

    public static getInstance(): StreamElementsService {
        return StreamElementsService.instance;
    }

    public async getStreamElementsId(accountId: string, twitchId: number) {
        return prisma.streamElements
            .upsert({
                where: {
                    account_id: accountId
                },
                create: {
                    account_id: accountId,
                    user: {
                        connect: {
                            twitch_id: twitchId
                        }
                    }
                },
                update: {},
                select: {
                    id: true
                }
            });
    }

    public async updateTokens(id: number, jwt: string) {
        return prisma.streamElements
            .update({
                where: {
                    id: id
                },
                data: {
                    jwt: jwt
                }
            });
    }

}

export default StreamElementsService.getInstance();
