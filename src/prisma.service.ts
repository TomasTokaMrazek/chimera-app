import {Injectable, OnModuleInit, OnModuleDestroy, Logger} from "@nestjs/common";

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

    private readonly logger: Logger = new Logger(PrismaService.name);

    async onModuleInit() {
        this.$on("query", (event: Prisma.QueryEvent) => {
            this.logger.log(`Query: ${event.query}`);
            this.logger.log(`Params: ${event.params}`);
            this.logger.log(`Duration: ${event.duration}ms`);
        });

        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

}
