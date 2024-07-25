import {NextFunction, Request, Response} from "express";

import streamLabsService from "./service";
import {AccountIds, OauthTokens, SocketToken} from "./types";

import configuration from "../configuration";

const streamLabsApiUrl: string = configuration.streamLabs.apiUrl;
const redirectUri: string = configuration.streamLabs.redirectUrl;
const clientID: string = configuration.streamLabs.clientId;

class StreamLabsController {

    public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const url: URL = new URL(streamLabsApiUrl + "/authorize");
            url.searchParams.append("response_type", "code");
            url.searchParams.append("client_id", clientID);
            url.searchParams.append("redirect_uri", redirectUri);
            url.searchParams.append("scope", "donations.read donations.create socket.token");

            res.redirect(url.toString());
        } catch (error) {
            next(error);
        }
    }

    public async oauthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authorizationCode: string = req.query.code as string;

            const oauthTokens: OauthTokens = await streamLabsService.getOauthTokens(authorizationCode);
            const socketToken: SocketToken = await streamLabsService.getSocketToken(oauthTokens.accessToken);
            const accountIds: AccountIds = await streamLabsService.getAccountIds(oauthTokens.accessToken);

            await streamLabsService.setTokens(accountIds, oauthTokens, socketToken);

            await streamLabsService.connectToWebSocket(socketToken.socketToken);

            res.redirect("/success");
        } catch (error) {
            next(error);
        }
    }
}

export default new StreamLabsController();
