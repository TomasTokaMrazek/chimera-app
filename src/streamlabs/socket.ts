import io from "socket.io-client";

import configuration from "../configuration";

const websocketUrl: string = configuration.streamLabs.websocketUrl;

class StreamLabsSocketClient {



    async openSocket(socketToken: string) {
        const socket = io(`${websocketUrl}?token=${socketToken}`, {
            transports: ["websocket"]
        });

        socket.on("connect", (): void => {
            console.log("[StreamLabs] Connected to the websocket server.");
        });

        socket.on("disconnect", (): void => {
            console.log("[StreamLabs] Disconnected from the websocket server.");
        });

        socket.onAny((eventName, ...args): void => {
            console.log(`[StreamLabs] EventName: ${eventName}, Args: ${JSON.stringify(args)}`);
        });

        return socket;
    }

}

export default new StreamLabsSocketClient();
