import io, {Socket} from "socket.io-client";

import configuration from "../../configuration";
import {User} from "@prisma/client";

const websocketUrl: string = configuration.streamElements.websocketUrl;

class StreamElementsSocketClient {

    private constructor(
        private readonly socket: Socket,
        private readonly user: User
    ) {
    }

    static createInstance(user: User, jwt: string): StreamElementsSocketClient {
        const socket: Socket = io(`${websocketUrl}`, {
            transports: ["websocket"]
        });
        socket.on("connect", (): void => {
            console.log("[StreamElements] Connected to the websocket server.");
            socket.emit("authenticate", {method: "jwt", token: jwt});
        });

        socket.on("authenticated", (): void => {
            console.log("[StreamElements] Authenticated to the websocket server.");
        });

        socket.on("unauthorized", (): void => {
            console.log("[StreamElements] Unable to authenticate to the websocket server.");
        });

        socket.on("disconnect", (): void => {
            console.log("[StreamElements] Disconnected from the websocket server.");
        });

        socket.onAny((eventName, ...args: any[]): void => {
            console.log(`[StreamElements] EventName: ${eventName}, Args: ${JSON.stringify(args)}`);
        });

        return new StreamElementsSocketClient(socket, user);
    }

}

export default StreamElementsSocketClient;
