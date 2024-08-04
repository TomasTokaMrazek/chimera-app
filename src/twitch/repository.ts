import prisma from "../prisma";
import {Twitch} from "@prisma/client";
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

    public async getByAccountId(accountId: string): Promise<Twitch> {
        return prisma.twitch
            .findUniqueOrThrow({
                where: {
                    account_id: accountId
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

    public async getOrInsertByAccountId(accountId: string): Promise<Twitch> {
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
                update: {}
            });
    }

    public async updateTokens(id: number, accessToken?: string, refreshToken?: string): Promise<Twitch> {
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
