import {Injectable} from "@nestjs/common";

import {PrismaService} from "@chimera/prisma";
import {StreamLabs} from "@chimera/prisma/client";

import {IdView} from "./views";

@Injectable()
export class StreamLabsRepository {

    constructor(
        private readonly prisma: PrismaService
    ) {}

    public async getById(id: number): Promise<StreamLabs> {
        return this.prisma.streamLabs
            .findUniqueOrThrow({
                where: {
                    id: id
                }
            });
    }

    public async getByAccountId(accountId: string): Promise<StreamLabs> {
        return this.prisma.streamLabs
            .findUniqueOrThrow({
                where: {
                    account_id: accountId
                }
            });
    }

    public async getOrInsertStreamLabsId(accountId: string, twitchId: number): Promise<IdView> {
        return this.prisma.streamLabs
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
        return this.prisma.streamLabs
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
