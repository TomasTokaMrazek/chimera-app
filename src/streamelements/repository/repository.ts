import {Injectable} from "@nestjs/common";

import {PrismaService} from "@chimera/prisma";
import {StreamElements} from "@prisma/client";
import {UserView} from "@chimera/twitch/repository/views";

import {IdView} from "./views";

@Injectable()
export class StreamElementsRepository {

    constructor(
        private readonly prisma: PrismaService
    ) {}

    public async getById(id: number): Promise<StreamElements> {
        return this.prisma.streamElements
            .findUniqueOrThrow({
                where: {
                    id: id
                }
            });
    }

    public async getByAccountId(accountId: string): Promise<StreamElements> {
        return this.prisma.streamElements
            .findUniqueOrThrow({
                where: {
                    account_id: accountId
                }
            });
    }

    public async getUserByAccountId(accountId: string): Promise<UserView> {
        return this.prisma.streamElements
            .findUniqueOrThrow({
                where: {
                    account_id: accountId
                },
                select: {
                    user: true
                }
            });
    }


    public async getOrInsertStreamElementsId(accountId: string, twitchId: number): Promise<IdView> {
        return this.prisma.streamElements
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
        return this.prisma.streamElements
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
