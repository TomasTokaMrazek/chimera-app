import {PrismaClient} from "@prisma/client";

function PrismaInstance(): PrismaClient {
    const instance = new PrismaClient({
        log: [
            {
                emit: "event",
                level: "query"
            }
        ]
    });

    instance.$on("query", async (e) => {
        console.log(`${e.query} ${e.params}`);
    });

    return instance;
}

export default PrismaInstance();
