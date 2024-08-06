import WebSocket from "ws";

class TwitchSocketClient {

    public constructor(
        private readonly _socket: WebSocket,
        private readonly _sessionId: string
    ) {}

    public get sessionId(): string {
        return this._sessionId;
    }

    public async subscribe(): Promise<void> {
        if (await this.isOpen()) {
            // TODO: Subscribe method
        }
    }

    public async ubsubscribe(): Promise<void> {
        if (await this.isOpen()) {
            // TODO: Unsubscribe method
        }
    }

    public async close(): Promise<void> {
        return this._socket.close();
    }

    public async isOpen(): Promise<boolean> {
        return this._socket.readyState === WebSocket.OPEN;
    }

}

export default TwitchSocketClient;
