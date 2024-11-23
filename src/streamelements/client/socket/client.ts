import {Logger} from "@nestjs/common";
import {EventEmitter2} from "@nestjs/event-emitter";

import {io, Socket} from "socket.io-client";

import configuration from "@chimera/configuration";

const websocketUrl: string = configuration.streamElements.websocketUrl;

export class StreamElementsSocketClient {

    private readonly logger: Logger = new Logger(StreamElementsSocketClient.name);

    constructor(
        private readonly socket: Socket,
        private readonly emitter: EventEmitter2
    ) {}

    static createInstance(emitter: EventEmitter2, jwt: string): StreamElementsSocketClient {
        const socket = io(`${websocketUrl}`, {
            transports: ["websocket"],
            autoConnect: false
        });

        const client: StreamElementsSocketClient = new StreamElementsSocketClient(socket, emitter);

        socket.on("connect", (): void => client.onConnect(jwt));
        socket.on("authenticated", (): void => client.onAuthenticated());
        socket.on("unauthorized", (): void => client.onUnauthorized());
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

    private onConnect(jwt: string): void {
        this.logger.log("[StreamElements] Connected to the websocket server.");
        this.socket.emit("authenticate", {method: "jwt", token: jwt});
    }

    private onAuthenticated(): void {
        this.logger.log("[StreamElements] Authenticated to the websocket server.");
        this.emitter.emit("streamelements.connected");
    }

    private onUnauthorized(): void {
        this.logger.log("[StreamElements] Unable to authenticate to the websocket server.");
    }

    private onDisconnect(reason: string): void {
        this.logger.log("[StreamElements] Disconnected from the websocket server.");
        this.emitter.emit("streamelements.disconnected", reason);
    }

    private onEvent(message: any): void {
        this.logger.log(`[StreamElements] Event: ${JSON.stringify(message)}`);
        this.emitter.emit("streamelements.event", message);
    }

    private onAny(eventName: any, ...args: any[]): void {
        this.logger.verbose(`[StreamElements] EventName: ${eventName}, Args: ${JSON.stringify(args)}`);
        this.emitter.emit("streamelements", eventName, args);
    }

}
