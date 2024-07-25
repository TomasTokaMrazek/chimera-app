import prisma from "../prisma";
import {StreamElements} from "@prisma/client";
import {IdView} from "../views";

class StreamElementsRepository {

    public async getOrCreateStreamElementsId(accountId: string, twitchId: number): Promise<IdView> {
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

    public async updateTokens(id: number, jwt: string): Promise<StreamElements> {
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

export {StreamElements};

export default new StreamElementsRepository();
