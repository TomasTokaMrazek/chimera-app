import io, {Socket} from "socket.io-client";

import configuration from "../../configuration";
import eventManager, {Donation} from "../../application/event/manager";
import {EventSyncService} from "../../application/event/dto";
import {User} from "@prisma/client";

const websocketUrl: string = configuration.streamLabs.websocketUrl;

class StreamLabsSocketClient {

    private constructor(
        private readonly socket: Socket<ServerToClientEvents, any>,
        private readonly user: User
    ) {
    }

    static createInstance(user: User, socketToken: string): StreamLabsSocketClient {
        const socket: Socket<ServerToClientEvents, any> = io(`${websocketUrl}?token=${socketToken}`, {
            transports: ["websocket"]
        });
        socket.on("connect", (): void => {
            console.log("[StreamLabs] Connected to the websocket server.");
        });

        socket.on("disconnect", (): void => {
            console.log("[StreamLabs] Disconnected from the websocket server.");
        });

        socket.on("event", (event: TipEvent): void => {
            switch (event.type) {
                case "donation": {
                    Promise.all(event.message.map(async (message: TipEventMessage): Promise<void[]> => {
                        const donation: Donation = {
                            username: message.name,
                            message: message.message,
                            currency: message.currency,
                            amount: message.amount
                        };

                        return await eventManager.syncDonations(EventSyncService.enum.STREAMLABS, user, donation);
                    })).catch(error => {
                        console.error(`[StreamLabs] Error processing event.`, error);
                    });
                    break;
                }
            }
        });

        socket.onAny((eventName, ...args: any[]): void => {
            console.log(`[StreamLabs] EventName: ${eventName}, Args: ${JSON.stringify(args)}`);
        });
        return new StreamLabsSocketClient(socket, user);
    }

}

interface ServerToClientEvents {
    event: (event: TipEvent) => void;
}

export interface TipEvent {
    type: string;
    message: any;
    event_id: string;
}

export interface TipEventMessage {
    id: number;
    name: string;
    currency: string;
    amount: number;
    formatted_amount: string;
    message?: string;
}

export default StreamLabsSocketClient;
