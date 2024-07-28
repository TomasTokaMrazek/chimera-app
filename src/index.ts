import express, {Express, Request, Response} from "express";

import configuration from "./configuration";

import applicationRouter from "./application/routes";
import twitchRoutes from "./twitch/routes";
import streamElementsRoutes from "./streamelements/routes";
import streamLabsRoutes from "./streamlabs/routes";

const app: Express = express();
const port: number = configuration.app.port;

app.use(express.json());

app.use("/application", applicationRouter);
app.use("/twitch", twitchRoutes);
app.use("/streamelements", streamElementsRoutes);
app.use("/streamlabs", streamLabsRoutes);

app.get("/success", (req: Request, res: Response): void => {
    res.send("Success!");
});

const server = app.listen(port, (): void => {
    console.log(`Chimera App listening on port ${port}`);
});

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
