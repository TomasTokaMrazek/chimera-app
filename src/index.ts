import server from "@chimera/express";

const shutdown = () => {
    console.log("\nClose down server gracefully.");
    server.close((err): void => {
        if (err) {
            console.error("Server could not be closed.", err);
            process.exit(1);
        } else {
            console.log("Server closed gracefully.");
            process.exit(0);
        }
    });

    setTimeout((): void => {
        console.error("Server was not closed in timeout, forcing shutdown.");
        process.exit(1);
    }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

process.on("uncaughtException", (err: Error): void => {
    console.error("Unhandled Exception:", err);
});

process.on("unhandledRejection", (reason, promise: Promise<any>): void => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
