import express, {Router} from "express";

import configuration from "../configuration";
import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../axios";
import streamLabsService from "./service";
import streamLabsSocket from "./socket";
import twitchService from "../twitch/service";
import {IdView} from "../views";

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

        const oauthTokensResponse: AxiosResponse<any, any> = await axiosInstance.post(streamLabsApi + "/token", tokenData, tokenConfig);
        const accessToken: string = String(oauthTokensResponse.data.access_token)  ?? ((): void => {
            throw new Error("Access Token is undefined.");
        });
        const refreshToken: string = String(oauthTokensResponse.data.refresh_token)  ?? ((): void => {
            throw new Error("Refresh Token is undefined.");
        });

        const config: {} = {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        };

        const socketTokenResponse: AxiosResponse<any, any> = await axiosInstance.get(streamLabsApi + "/socket/token", config);
        const socketToken: string = String(socketTokenResponse.data.socket_token);

        const userResponse: AxiosResponse<any, any> = await axiosInstance.get(streamLabsApi + "/user", config);
        const twitchAccountId: string = String(userResponse.data.twitch.id) ?? ((): void => {
            throw new Error("Twitch Account ID is undefined.");
        });
        const streamLabsAccountId: string = String(userResponse.data.streamlabs.id) ?? ((): void => {
            throw new Error("StreamLabs Account ID is undefined.");
        });

        const twitchId: IdView = await twitchService.getTwitchId(twitchAccountId);
        const streamLabsId: IdView = await streamLabsService.getStreamLabsId(streamLabsAccountId, twitchId.id);

        await streamLabsService.updateTokens(streamLabsId.id, accessToken, refreshToken, socketToken);

        streamLabsSocket(socketToken);

        res.redirect("/success");
    } catch (error) {
        next(error);
    }
});

export default router;
