import io from "socket.io-client";

import configuration from "../configuration";

function connect(jwt: string) {
    const socket = io(configuration.streamElements.websocketUrl, {
        transports: ["websocket"]
    });

    socket.on("connect", (): void => {
        console.log("Connected to the StreamElements websocket server.");
        socket.emit("authenticate", {method: "jwt", token: jwt});
    });

    socket.on("disconnect", (): void => {
        console.log("Disconnected from the StreamElements websocket server.");
    });

    socket.onAny((eventName, ...args) => {
        console.log(`EventName: ${eventName}, Args: ${JSON.stringify(args)}`);
    });

    return socket;
}

export default connect;
