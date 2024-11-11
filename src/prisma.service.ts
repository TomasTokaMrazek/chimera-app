import {Injectable, OnModuleInit, OnModuleDestroy} from "@nestjs/common";

import {Prisma, PrismaClient} from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, "query"> implements OnModuleInit, OnModuleDestroy {

    constructor() {
        super({
            log: [
                {
                    emit: "event",
                    level: "query"
                }
            ]
        });
    }

    async onModuleInit() {
        this.$on("query", (event: Prisma.QueryEvent) => {
            console.log(`Query: ${event.query}`);
            console.log(`Params: ${event.params}`);
            console.log(`Duration: ${event.duration}ms`);
        });

        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

}
