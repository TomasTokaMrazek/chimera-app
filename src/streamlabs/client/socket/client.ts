import io, {Socket} from "socket.io-client";

import eventManager, {Donation} from "@chimera/application/event/manager";
import {EventSyncService} from "@chimera/application/event/dto";

import {User} from "@prisma/client";

import * as Dto from "./dto";

import configuration from "@chimera/configuration";

const websocketUrl: string = configuration.streamLabs.websocketUrl;

class StreamLabsSocketClient {

    static createInstance(user: User, socketToken: string): StreamLabsSocketClient {
        const socket: Socket<Dto.ServerToClientEvents, any> = io(`${websocketUrl}?token=${socketToken}`, {
            transports: ["websocket"]
        });
        socket.on("connect", (): void => {
            console.log("[StreamLabs] Connected to the websocket server.");
        });

        socket.on("disconnect", (): void => {
            console.log("[StreamLabs] Disconnected from the websocket server.");
        });

        socket.on("event", (event: Dto.TipEvent): void => {
            switch (event.type) {
                case "donation": {
                    Promise.all(event.message.map(async (message: Dto.TipEventMessage): Promise<void[]> => {
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
        return new StreamLabsSocketClient();
    }

}

export default StreamLabsSocketClient;
