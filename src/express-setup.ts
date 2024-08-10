import express, {Express, Request, Response} from "express";

import applicationRouter from "@chimera/application/routes";
import twitchRoutes from "@chimera/twitch/routes";
import streamElementsRoutes from "@chimera/streamelements/routes";
import streamLabsRoutes from "@chimera/streamlabs/routes";

import configuration from "@chimera/configuration";

const port: number = configuration.app.port;

const app: Express = express();

app.use(express.json());

app.use("/application", applicationRouter);
app.use("/streamelements", streamElementsRoutes);
app.use("/streamlabs", streamLabsRoutes);
app.use("/twitch", twitchRoutes);

app.get("/success", (req: Request, res: Response): void => {
    res.send("Success!");
});

const server = app.listen(port, (): void => {
    console.log(`Chimera App listening on port ${port}`);
});

export default server;
