import prisma from "@chimera/prisma";
import {StreamElements} from "@prisma/client";
import {IdView} from "../views";

class StreamElementsRepository {

    public async getById(id: number): Promise<StreamElements> {
        return prisma.streamElements
            .findUniqueOrThrow({
                where: {
                    id: id
                }
            });
    }

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

export default new StreamElementsRepository();
