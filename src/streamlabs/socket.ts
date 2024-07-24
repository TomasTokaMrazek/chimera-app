import io from "socket.io-client";

import configuration from "../configuration";

function connect(socketToken: string) {
    const socket = io(configuration.streamLabs.websocketUrl + `?token=${socketToken}`, {
        transports: ["websocket"]
    });

    socket.on("connect", (): void => {
        console.log("Connected to the StreamLabs websocket server.");
    });

    socket.on("disconnect", (): void => {
        console.log("Disconnected from the StreamLabs websocket server.");
    });

    socket.onAny((eventName, ...args) => {
        console.log(`EventName: ${eventName}, Args: ${JSON.stringify(args)}`);
    });

    return socket;
}

export default connect;
