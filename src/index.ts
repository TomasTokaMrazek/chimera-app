import express, {Express, Request, Response} from "express";

import configuration from "./configuration";
import streamElementsRoutes from "./streamelements/routes";
import streamLabsRoutes from "./streamlabs/routes";

const app: Express = express();
const port: number = configuration.app.port;
const server = app.listen(port, (): void => {
    console.log(`Example app listening on port ${port}`);
});

app.use(express.json());

app.get("/success", (req: Request, res: Response): void => {
    res.send("Success!");
});

app.use("/streamelements", streamElementsRoutes);
app.use("/streamlabs", streamLabsRoutes);

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
