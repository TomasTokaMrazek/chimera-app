import prisma from "../prisma";
import {IdView} from "../views";
import {StreamLabs} from "@prisma/client";

class StreamLabsService {

    private static instance: StreamLabsService = new StreamLabsService();

    private constructor() {

    }

    public static getInstance(): StreamLabsService {
        return StreamLabsService.instance;
    }

    public async getStreamLabsId(accountId: string, twitchId: number): Promise<IdView> {
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

export default StreamLabsService.getInstance();
