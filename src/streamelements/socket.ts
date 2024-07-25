import io from "socket.io-client";

import configuration from "../configuration";

const websocketUrl: string = configuration.streamElements.websocketUrl;

class StreamElementsSocketClient {

    async openSocket(jwt: string) {
        const socket = io(`${websocketUrl}`, {
            transports: ["websocket"]
        });

        socket.on("connect", (): void => {
            console.log("Connected to the StreamLabs websocket server.");
            socket.emit("authenticate", {method: "jwt", token: jwt});
        });

        socket.on("disconnect", (): void => {
            console.log("Disconnected from the StreamLabs websocket server.");
        });

        socket.onAny((eventName, ...args): void => {
            console.log(`EventName: ${eventName}, Args: ${JSON.stringify(args)}`);
        });

        return socket;
    }

}

export default new StreamElementsSocketClient();
