import express, {Router} from "express";
import {JwtPayload} from "jsonwebtoken";

import configuration from "../configuration";
import http, {AxiosResponse} from "../axios";
import twitchService from "../twitch/service";
import streamElementsService from "../streamelements/service";
import streamElementsSocket from "../streamelements/socket";

type StreamElementsJwtPayload = JwtPayload & {
    channel: string
};

const streamElementsApi: string = configuration.streamElements.apiUrl;

const router: Router = express.Router();

router.get("/login", async (req, res, next): Promise<void> => {
    try {

        const jwt: string = req.query.jwt as string;

        const config: {} = {
            headers: {
                "Authorization": `Bearer ${jwt}`
            }
        };

        const ids = await http.get(streamElementsApi + "/users/current", config)
            .then((response: AxiosResponse<any, any>) => {
                const twitchAccountId: number = response.data.channels.find((channel: any): boolean => channel.provider == "twitch")?.providerId ?? ((): void => {
                    throw new Error("Twitch Account ID is undefined.");
                });
                const streamElementsAccountId: number = response.data._id ?? ((): void => {
                    throw new Error("StreamElements Account ID is undefined.");
                });
                console.log(`Twitch ID: ${twitchAccountId}`);
                console.log(`StreamElements ID: ${streamElementsAccountId}`);
                return {
                    twitchAccountId: String(twitchAccountId),
                    streamElementsAccountId: String(streamElementsAccountId)
                };
            });

        const twitchId = await twitchService.getTwitchId(ids.twitchAccountId);
        const streamElementsId = await streamElementsService.getStreamElementsId(ids.streamElementsAccountId, twitchId.id);

        await streamElementsService.updateTokens(streamElementsId.id, jwt);

        streamElementsSocket(jwt);

        res.redirect("/success");
    } catch (error) {
        next(error);
    }
});

export default router;
