import {Prisma, PrismaClient} from "@prisma/client";

function prismaInstance(): PrismaClient {
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

    return instance;
}

export default prismaInstance();
