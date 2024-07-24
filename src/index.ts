import express, {Express, Request, Response} from "express";

import configuration from "./configuration";
import twitchRouter from "./twitch/controller";
import streamElementsRouter from "./streamelements/controller";
import streamLabsRouter from "./streamlabs/controller";

const app: Express = express();
const port: number = configuration.app.port;
const server = app.listen(port, (): void => {
    console.log(`Example app listening on port ${port}`);
});

app.get("/success", (req: Request, res: Response): void => {
    res.send("Success!");
});

app.use("/twitch", twitchRouter);
app.use("/streamelements", streamElementsRouter);
app.use("/streamlabs", streamLabsRouter);

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
