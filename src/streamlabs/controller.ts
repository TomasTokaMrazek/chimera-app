import express, {Router} from "express";

import configuration from "../configuration";
import http, {AxiosRequestConfig, AxiosResponse} from "../axios";
import streamLabsService from "./service";
import streamLabsSocket from "./socket";
import twitchService from "../twitch/service";

const streamLabsApi: string = configuration.streamLabs.apiUrl;

const redirectUri: string = configuration.app.url + "/streamlabs/oauth/callback";
const clientID: string = configuration.streamLabs.clientId;
const clientSecret: string = configuration.streamLabs.clientSecret;

const router: Router = express.Router();

router.get("/login", async (req, res): Promise<void> => {
    const url: URL = new URL(configuration.streamLabs.apiUrl + "/authorize");
    url.searchParams.append("response_type", "code");
    url.searchParams.append("client_id", clientID);
    url.searchParams.append("redirect_uri", redirectUri);
    url.searchParams.append("scope", "donations.read donations.create socket.token");

    res.redirect(url.toString());
});

router.get("/oauth/callback", async (req, res, next): Promise<void> => {
    try {
        const authorizationCode: string = req.query.code as string;

        const tokenData: {} = {
            "grant_type": "authorization_code",
            "code": authorizationCode,
            "redirect_uri": redirectUri,
            "client_id": clientID,
            "client_secret": clientSecret
        };

        const tokenConfig: AxiosRequestConfig = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const oauthTokens = await http
            .post(streamLabsApi + "/token", tokenData, tokenConfig)
            .then((response: AxiosResponse<any, any>) => {
                return {
                    accessToken: String(response.data.access_token),
                    refreshToken: String(response.data.refresh_token)
                };
            });

        const config: {} = {
            headers: {
                "Authorization": `Bearer ${oauthTokens.accessToken}`
            }
        };

        const socketToken = await http
            .get(streamLabsApi + "/socket/token", config)
            .then((response: AxiosResponse<any, any>) => {
                return {
                    socketToken: String(response.data.socket_token)
                };
            });

        const ids = await http
            .get(streamLabsApi + "/user", config)
            .then((response: AxiosResponse<any, any>) => {
                const twitchAccountId: number = response.data.twitch.id ?? ((): void => {
                    throw new Error("Twitch Account ID is undefined.");
                });
                const streamLabsAccountId: number = response.data.streamlabs.id ?? ((): void => {
                    throw new Error("StreamLabs Account ID is undefined.");
                });
                console.log(`Twitch Account ID: ${twitchAccountId}`);
                console.log(`StreamLabs Account ID: ${streamLabsAccountId}`);
                return {
                    twitchAccountId: String(twitchAccountId),
                    streamLabsAccountId: String(streamLabsAccountId)
                };
            });

        const twitchId = await twitchService.getTwitchId(ids.twitchAccountId);
        const streamLabsId = await streamLabsService.getStreamLabsId(ids.streamLabsAccountId, twitchId.id);

        await streamLabsService.updateTokens(streamLabsId.id, oauthTokens.accessToken, oauthTokens.refreshToken, socketToken.socketToken);

        streamLabsSocket(socketToken.socketToken);

        res.redirect("/success");
    } catch (error) {
        next(error);
    }
});

export default router;
