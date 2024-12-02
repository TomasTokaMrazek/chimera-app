import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from "@nestjs/common";

import {Prisma, PrismaClient} from "@chimera/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, "query" | "info" | "warn" | "error"> implements OnModuleInit, OnModuleDestroy {

    constructor() {
        super({
            log: [
                {
                    emit: "event",
                    level: "query"
                },
                {
                    emit: "event",
                    level: "info"
                },
                {
                    emit: "event",
                    level: "warn"
                },
                {
                    emit: "event",
                    level: "error"
                }
            ]
        });
    }

    private readonly logger: Logger = new Logger(PrismaService.name);

    async onModuleInit(): Promise<void> {
        this.$on("query", (event: Prisma.QueryEvent): void => {
            this.logger.log(`Query: ${event.query}`);
            this.logger.log(`Params: ${event.params}`);
            this.logger.log(`Duration: ${event.duration}ms`);
        });

        this.$on("info", (event: Prisma.LogEvent): void => {
            this.logger.log(event.target);
        });

        this.$on("warn", (event: Prisma.LogEvent): void => {
            this.logger.warn(event.target);
        });

        this.$on("error", (event: Prisma.LogEvent): void => {
            this.logger.error(event.target);
        });

        await this.$connect();
    }

    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
    }

}
