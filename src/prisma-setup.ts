import {Prisma, PrismaClient} from "@prisma/client";

const instance = new PrismaClient({
    log: [
        {
            emit: "event",
            level: "query"
        }
    ]
});

instance.$on("query", async (event: Prisma.QueryEvent): Promise<void> => {
    console.log(`${event.query} ${event.params}`);
});

export default instance;
