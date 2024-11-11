import {Injectable, Logger} from "@nestjs/common";

import WebSocket, {RawData} from "ws";
import {CronJob} from "cron";

import {AxiosResponse} from "@chimera/axios";

import {TwitchRepository} from "@chimera/twitch/repository/repository";
import {AccountIdView} from "@chimera/twitch/repository/views";

import {TwitchHttpClientManager} from "@chimera/twitch/client/http/manager";
import TwitchHttpClient from "@chimera/twitch/client/http/client";
import * as EventSub from "@chimera/twitch/client/http/dto/eventsub";

import TwitchSocketClient from "./client";
import * as Message from "./dto/message";

@Injectable()
export class TwitchSocketClientManager {

    constructor(
        private readonly twitchRepository: TwitchRepository,
        private readonly twitchHttpClientManager: TwitchHttpClientManager
    ) {}

    private readonly logger: Logger = new Logger(TwitchSocketClientManager.name);
    private readonly socketClients: Map<number, TwitchSocketClient> = new Map();
    private readonly cronJob: CronJob = new CronJob("0 * * * * *", async (): Promise<void> => {
        try {
            this.logger.log("Cron Job - start");
            await Promise.all(Array.from(this.socketClients.entries()).map(async ([twitchId, socketClient]: [number, TwitchSocketClient]): Promise<void> => {
                if (!await socketClient.isOpen()) {
                    this.socketClients.delete(twitchId);
                }
            }));
            this.logger.log("Cron Job - end");
        } catch (e) {
            this.logger.error(e);
        }
    }, null, true);

    public async connectClient(twitchId: number, url: string): Promise<void> {
        const socket: WebSocket = new WebSocket(url);

        socket.on("error", (error: Error): void => {
            this.logger.error(`[Twitch] Websocket server threw an error.`, error);
        });

        socket.on("open", (): void => {
            this.logger.log(`[Twitch] Connected to the websocket server.`);
        });

        socket.on("close", (code: number, reason: Buffer): void => {
            this.logger.log(`[Twitch] Disconnected from the websocket server. Code: ${code}, Reason: ${reason}`);
        });

        socket.on("message", async (data: RawData): Promise<void> => {
            const parsedData = JSON.parse(data.toString());
            const messageType: string = parsedData.metadata.message_type;
            switch (messageType) {
                case "session_welcome": {
                    const message: Message.WelcomeMessage = parsedData as Message.WelcomeMessage;
                    await this.sessionWelcome(message, twitchId, socket);
                    break;
                }
                case "session_keepalive": {
                    const message: Message.KeepaliveMessage = parsedData as Message.KeepaliveMessage;
                    await this.sessionKeepalive(message);
                    break;
                }
                case "session_reconnect": {
                    const message: Message.ReconnectMessage = parsedData as Message.ReconnectMessage;
                    await this.sessionReconnect(message, twitchId);
                    break;
                }
                case "notification": {
                    const message: Message.NotificationMessage = parsedData as Message.NotificationMessage;
                    await this.notification(message);
                    break;
                }
                case "revocation": {
                    const message: Message.RevocationMessage = parsedData as Message.RevocationMessage;
                    await this.revocation(message);
                    break;
                }
            }
        });
    }

    public async disconnectClient(twitchId: number): Promise<void> {
        const accountIdView: AccountIdView = await this.twitchRepository.getAccountIdById(twitchId);
        const httpClient: TwitchHttpClient = await this.twitchHttpClientManager.getHttpClient(twitchId);

        const requestParams: EventSub.GetEventSubSubscriptionRequestParams = {
            user_id: accountIdView.account_id
        };
        const response: AxiosResponse<EventSub.GetEventSubSubscriptionResponseBody> = await httpClient.getEventSubSubscription(requestParams);

        await Promise.all(response.data.data.map(async (data: EventSub.CreateEventSubSubscriptionData): Promise<AxiosResponse<void>> => {
            const deleteRequestParams: EventSub.DeleteEventSubSubscriptionRequestParams = {
                id: data.id
            };

            return await httpClient.deleteEventSubSubscription(deleteRequestParams);
        }));

        const client: TwitchSocketClient = this.socketClients.get(twitchId) ?? ((): TwitchSocketClient => {
            throw new Error(`Twitch ID '${twitchId}' does not have Socket Client.`);
        })();
        this.socketClients.delete(twitchId);
        return client.close();
    }

    public async getSocketClient(twitchId: number): Promise<TwitchSocketClient> {
        return this.socketClients.get(twitchId) ?? ((): TwitchSocketClient => {
            throw new Error(`Twitch ID '${twitchId}' does not have Socket Client.`);
        })();
    }

    private async sessionWelcome(message: Message.WelcomeMessage, twitchId: number, socket: WebSocket): Promise<void> {
        const sessionId: string = message.payload.session.id;

        if (!this.socketClients.has(twitchId)) {
            const accountIdView: AccountIdView = await this.twitchRepository.getAccountIdById(twitchId);
            const httpClient: TwitchHttpClient = await this.twitchHttpClientManager.getHttpClient(twitchId);
            const body: EventSub.CreateEventSubSubscriptionRequestBody = {
                type: "channel.chat.message",
                version: "1",
                condition: {
                    broadcaster_user_id: accountIdView.account_id,
                    user_id: accountIdView.account_id
                },
                transport: {
                    method: EventSub.EventSubSubscriptionTransportMethod.WEBSOCKET,
                    session_id: sessionId
                }
            };
            const response: AxiosResponse<EventSub.CreateEventSubSubscriptionResponseBody> = await httpClient.createEventSubSubscription(body);
            if (response.status !== 202) {
                throw new Error(`Twitch Socket Session ID '${sessionId}' was unable to subscribe to event.`);
            }
        }

        const socketClient: TwitchSocketClient = new TwitchSocketClient(this.twitchHttpClientManager, socket, sessionId);
        this.socketClients.set(twitchId, socketClient);
    }

    private async sessionKeepalive(message: Message.KeepaliveMessage): Promise<void> {
        this.logger.log(`Session Keepalive: ${JSON.stringify(message)}`);
    }

    private async sessionReconnect(message: Message.ReconnectMessage, twitchId: number): Promise<void> {
        const reconnectUrl: string = message.payload.session.reconnect_url;
        const socketClient: TwitchSocketClient = this.socketClients.get(twitchId) ?? ((): TwitchSocketClient => {
            throw new Error(`Twitch Socket Client for ID '${twitchId}' is undefined.`);
        })();
        await this.connectClient(twitchId, reconnectUrl);
        await socketClient.close();
    }

    private async notification(message: Message.NotificationMessage): Promise<void> {
        this.logger.log(`Notification: ${JSON.stringify(message)}`);
    }

    private async revocation(message: Message.RevocationMessage): Promise<void> {
        this.logger.log(`Revocation: ${JSON.stringify(message)}`);
    }
}
