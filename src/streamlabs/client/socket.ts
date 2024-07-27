import io, {Socket} from "socket.io-client";

import configuration from "../../configuration";

const websocketUrl: string = configuration.streamLabs.websocketUrl;

class StreamLabsSocketClient {

    private constructor(
        private readonly socket: Socket
    ) {
    }

    static createInstance(socketToken: string): StreamLabsSocketClient {
        const socket: Socket = io(`${websocketUrl}?token=${socketToken}`, {
            transports: ["websocket"]
        });
        socket.on("connect", (): void => {
            console.log("[StreamLabs] Connected to the websocket server.");
        });

        socket.on("authenticated", (): void => {
            console.log("[StreamLabs] Authenticated to the websocket server.");
        });

        socket.on("unauthorized", (): void => {
            console.log("[StreamLabs] Unable to authenticate to the websocket server.");
        });

        socket.on("disconnect", (): void => {
            console.log("[StreamLabs] Disconnected from the websocket server.");
        });

        socket.onAny((eventName, ...args: any[]): void => {
            console.log(`[StreamLabs] EventName: ${eventName}, Args: ${JSON.stringify(args)}`);
        });
        return new StreamLabsSocketClient(socket);
    }

}

export default StreamLabsSocketClient;
