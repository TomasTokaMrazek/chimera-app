import express, {Router} from "express";
import axios, {AxiosResponse} from 'axios';
import io from "socket.io-client";

import configuration from '../configuration';

const streamLabsApi: string = configuration.streamLabs.apiUrl;

const redirectUri: string = configuration.app.url + '/streamlabs/oauth/callback';
const clientID: string = configuration.streamLabs.clientId;
const clientSecret: string = configuration.streamLabs.clientSecret;

const router: Router = express.Router();

router.get('/streamlabs/login', async (req, res): Promise<void> => {
    const url: URL = new URL(configuration.streamLabs.apiUrl + '/authorize');
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('client_id', clientID);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('scope', 'donations.read socket.token');

    res.redirect(url.toString());
});

router.get('/streamlabs/oauth/callback', async (req, res): Promise<void> => {
    const authorizationCode: string = req.query.code as string;
    console.log(`AuthorizationCode: ${authorizationCode}`);

    const formData: FormData = new FormData();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', authorizationCode);
    formData.append('redirect_uri', redirectUri);
    formData.append('client_id', clientID);
    formData.append('client_secret', clientSecret);

    let accessToken: string | undefined;
    let refreshToken: string | undefined;
    let socketToken: string | undefined;

    await axios.post(streamLabsApi + '/token', formData)
        .then((response: AxiosResponse<any, any>): void => {
            accessToken = response.data.access_token;
            refreshToken = response.data.refresh_token;
            console.log(`Access Token: ${accessToken}`);
            console.log(`Refresh Token: ${refreshToken}`);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send();
        });

    const config: {} = {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    };

    await axios.get(streamLabsApi + '/socket/token', config)
        .then((response: AxiosResponse<any, any>): void => {
            socketToken = response.data.socket_token;
            console.log(`Socket Token: ${socketToken}`);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send();
        });

    const socket = io(configuration.streamLabs.websocketUrl + `?token=${socketToken}`);

    socket.on('connect', (): void => {
        console.log('Connected to the WebSocket server.');
    });

    socket.on('disconnect', (): void => {
        console.log('Disconnected from the WebSocket server-');
    });

    socket.on("data", (data):void => {
        console.log(`Data: ${data}`);
    });

    socket.onAny((eventName, ...args) => {
        console.log(`EventName: ${eventName}, Args: ${JSON.stringify(args)}`);
    });

    res.redirect('/success');
});

export default router;
