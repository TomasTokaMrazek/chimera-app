import prisma from "../prisma";
import {StreamLabs, Twitch} from "@prisma/client";
import {UserView} from "../views";

class TwitchRepository {

    public async getById(id: number): Promise<Twitch> {
        return prisma.twitch
            .findUniqueOrThrow({
                where: {
                    id: id
                }
            });
    }

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

    public async getOrInsertByTwitchId(accountId: string): Promise<UserView> {
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
                    user: true
                }
            });
    }

    public async updateTokens(id: number, accessToken: string, refreshToken: string): Promise<Twitch> {
        return prisma.twitch
            .update({
                where: {
                    id: id
                },
                data: {
                    access_token: accessToken,
                    refresh_token: refreshToken
                }
            });
    }

}

export {Twitch}

export default new TwitchRepository();
