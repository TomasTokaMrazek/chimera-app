import {Injectable, Logger} from "@nestjs/common";
import {EventEmitter2} from "@nestjs/event-emitter";

import {StreamLabs} from "@chimera/prisma/client";

import {StreamLabsRepository} from "@chimera/streamlabs/repository/repository";
import {StreamLabsSocketClient} from "@chimera/streamlabs/client/socket/client";

@Injectable()
export class StreamLabsSocketClientManager {

    private readonly logger: Logger = new Logger(StreamLabsSocketClientManager.name);

    private readonly clients: Map<string, StreamLabsSocketClient> = new Map();

    constructor(
        private readonly emitter: EventEmitter2,
        private readonly streamLabsRepository: StreamLabsRepository,
    ) {}

    async createClient(accountId: string): Promise<void> {
        const streamLabs: StreamLabs = await this.streamLabsRepository.getByAccountId(accountId);
        const socketToken: string = streamLabs.socket_token ?? ((): string => {
            throw new Error(`StreamLabs Account '${accountId}' does not have Authorization token`);
        })();

        const client: StreamLabsSocketClient = StreamLabsSocketClient.createInstance(this.emitter, accountId, socketToken);
        client.connect();

        this.clients.set(accountId, client);
    }

    async destroyClient(accountId: string): Promise<void> {
        const client: StreamLabsSocketClient = this.clients.get(accountId) ?? ((): StreamLabsSocketClient => {
            throw new Error(`StreamLabs Socket Client fo Account '${accountId}' does not exist.`);
        })();
        client.disconnect();

        this.clients.delete(accountId);
    }

}
