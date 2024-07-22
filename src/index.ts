import express, {Express, Request, Response} from "express";

import configuration from './configuration';
import streamLabsOauthRouter from "./streamlabs/oauth";

const app: Express = express();
const port: number = configuration.app.port;
const server = app.listen(port, (): void => {
    console.log(`Example app listening on port ${port}`)
});

app.get('/', (req: Request, res: Response): void => {
    res.send('Hello World!')
});

app.get('/success', (req: Request, res: Response): void => {
    res.send('Success!')
});

app.use('/', streamLabsOauthRouter);

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
