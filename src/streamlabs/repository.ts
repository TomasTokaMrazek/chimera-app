import prisma from "../prisma";
import {StreamLabs} from "@prisma/client";
import {IdView} from "../views";

class StreamLabsRepository {

    public async getById(id: number): Promise<StreamLabs> {
        return prisma.streamLabs
            .findUniqueOrThrow({
                where: {
                    id: id
                }
            });
    }

    public async getOrCreateStreamLabsId(accountId: string, twitchId: number): Promise<IdView> {
        return prisma.streamLabs
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

    public async updateTokens(id: number, accessToken: string, refreshToken: string, socketToken: string): Promise<StreamLabs> {
        return prisma.streamLabs
            .update({
                where: {
                    id: id
                },
                data: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    socket_token: socketToken
                }
            });
    }

}

export {StreamLabs};

export default new StreamLabsRepository();
