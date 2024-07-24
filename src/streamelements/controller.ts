import express, {Router} from "express";
import {JwtPayload} from "jsonwebtoken";

import configuration from "../configuration";
import axiosInstance, {AxiosResponse} from "../axios";
import twitchRepository from "../twitch/repository";
import streamElementsService from "../streamelements/repository";
import streamElementsSocket from "../streamelements/socket";
import {IdView} from "../views";

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

        const userResponse: AxiosResponse<any, any> = await axiosInstance.get(streamElementsApi + "/users/current", config);
        const twitchAccountId: string = String(userResponse.data.channels.find((channel: any): boolean => channel.provider == "twitch")?.providerId ?? ((): void => {
            throw new Error("Twitch Account ID is undefined.");
        }));
        const streamElementsAccountId: string = String(userResponse.data._id) ?? ((): void => {
            throw new Error("StreamLabs Account ID is undefined.");
        });

        const twitchId: IdView = await twitchRepository.getTwitchId(twitchAccountId);
        const streamElementsId: IdView = await streamElementsService.getStreamElementsId(streamElementsAccountId, twitchId.id);

        await streamElementsService.updateTokens(streamElementsId.id, jwt);

        streamElementsSocket(jwt);

        res.redirect("/success");
    } catch (error) {
        next(error);
    }
});

export default router;
