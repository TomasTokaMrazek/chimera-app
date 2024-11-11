import WebSocket from "ws";

import {AxiosResponse} from "axios";

import {TwitchHttpClientManager} from "@chimera/twitch/client/http/manager";
import TwitchHttpClient from "@chimera/twitch/client/http/client";
import * as EventSub from "@chimera/twitch/client/http/dto/eventsub";

export type HandleMessageFunction = (
    this: WebSocket,
    data: WebSocket.RawData,
    isBinary: boolean
) => void;

class TwitchSocketClient {

    public constructor(
        private readonly twitchHttpClientManager: TwitchHttpClientManager,
        private readonly _socket: WebSocket,
        private readonly _sessionId: string
    ) {}

    public get sessionId(): string {
        return this._sessionId;
    }

    public async subscribe(twitchId: number, body: EventSub.CreateEventSubSubscriptionRequestBody, handleMessage: HandleMessageFunction): Promise<string> {
        if (await this.isOpen()) {
            const httpClient: TwitchHttpClient = await this.twitchHttpClientManager.getHttpClient(twitchId);
            const response: AxiosResponse<EventSub.CreateEventSubSubscriptionResponseBody> = await httpClient.createEventSubSubscription(body);
            if (response.status !== 202) {
                throw new Error(`Twitch Socket Session ID '${this._sessionId}' was unable to subscribe to event.`);
            }

            this._socket.on("message", handleMessage);

            return response.data.data[0].id;
        } else {
            throw new Error(`Twitch Socket Session ID '${this._sessionId}' is not open.`);
        }
    }

    public async unsubscribe(twitchId: number, params: EventSub.DeleteEventSubSubscriptionRequestParams, handleMessage: HandleMessageFunction): Promise<void> {
        if (await this.isOpen()) {
            const httpClient: TwitchHttpClient = await this.twitchHttpClientManager.getHttpClient(twitchId);
            const response: AxiosResponse<void> = await httpClient.deleteEventSubSubscription(params);
            if (response.status !== 204) {
                throw new Error(`Twitch Socket Session ID '${this._sessionId}' was unable to unsubscribe from event.`);
            }

            this._socket.off("message", handleMessage);
        } else {
            throw new Error(`Twitch Socket Session ID '${this._sessionId}' is not open.`);
        }
    }

    public async close(): Promise<void> {
        return this._socket.close();
    }

    public async isOpen(): Promise<boolean> {
        return this._socket.readyState === WebSocket.OPEN;
    }

}

export default TwitchSocketClient;
