import {Logger} from "@nestjs/common";
import {EventEmitter2} from "@nestjs/event-emitter";

import {io, Socket} from "socket.io-client";

import * as Dto from "./dto";

import configuration from "@chimera/configuration";

const websocketUrl: string = configuration.streamLabs.websocketUrl;

export class StreamLabsSocketClient {

    private readonly logger: Logger = new Logger(StreamLabsSocketClient.name);

    constructor(
        private readonly socket: Socket<Dto.ServerToClientEvents, any>,
        private readonly emitter: EventEmitter2,
        private readonly accountId: string
    ) {}

    static createInstance(emitter: EventEmitter2, accountId: string, socketToken: string): StreamLabsSocketClient {
        const socket = io(`${websocketUrl}?token=${socketToken}`, {
            transports: ["websocket"],
            autoConnect: false
        });

        const client: StreamLabsSocketClient = new StreamLabsSocketClient(socket, emitter, accountId);

        socket.on("connect", (): void => client.onConnect());
        socket.on("disconnect", (reason: string): void => client.onDisconnect(reason));
        socket.on("event", (message: object): void => client.onEvent(message));
        socket.onAny((eventName: any, ...args: any[]): void => client.onAny(eventName, args));

        return client;
    }

    connect(): void {
        this.socket.connect();
    }

    disconnect(): void {
        this.socket.disconnect();
    }

    isConnected(): boolean {
        return this.socket.connected;
    }

    private onConnect(): void {
        this.logger.log("[StreamLabs] Connected to the websocket server.");
    }

    private onDisconnect(reason: string): void {
        this.logger.log("[StreamLabs] Disconnected from the websocket server.");
        this.emitter.emit("streamlabs.disconnected", reason);
    }

    private onEvent(message: any): void {
        this.logger.log(`[StreamLabs] Event: ${JSON.stringify(message)}`);
        this.emitter.emit("streamlabs.event", message, this.accountId);
    }

    private onAny(eventName: any, ...args: any[]): void {
        this.logger.verbose(`[StreamLabs] EventName: ${eventName}, Args: ${JSON.stringify(args)}`);
        this.emitter.emit("streamlabs", eventName, args);
    }

}
