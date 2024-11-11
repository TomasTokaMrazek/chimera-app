import {Logger} from "@nestjs/common";

import io, {Socket} from "socket.io-client";

import configuration from "@chimera/configuration";
import {User} from "@prisma/client";

const websocketUrl: string = configuration.streamElements.websocketUrl;

class StreamElementsSocketClient {

    private static readonly logger: Logger = new Logger(StreamElementsSocketClient.name);

    static createInstance(user: User, jwt: string): StreamElementsSocketClient {
        const socket: Socket = io(`${websocketUrl}`, {
            transports: ["websocket"]
        });
        socket.on("connect", (): void => {
            this.logger.log("[StreamElements] Connected to the websocket server.");
            socket.emit("authenticate", {method: "jwt", token: jwt});
        });

        socket.on("authenticated", (): void => {
            this.logger.log("[StreamElements] Authenticated to the websocket server.");
        });

        socket.on("unauthorized", (): void => {
            this.logger.log("[StreamElements] Unable to authenticate to the websocket server.");
        });

        socket.on("disconnect", (): void => {
            this.logger.log("[StreamElements] Disconnected from the websocket server.");
        });

        socket.onAny((eventName, ...args: any[]): void => {
            this.logger.log(`[StreamElements] EventName: ${eventName}, Args: ${JSON.stringify(args)}`);
        });

        return new StreamElementsSocketClient();
    }

}

export default StreamElementsSocketClient;
