import {Injectable, Logger} from "@nestjs/common";
import {EventEmitter2} from "@nestjs/event-emitter";

import {StreamElements} from "@prisma/client";

import {StreamElementsRepository} from "@chimera/streamelements/repository/repository";
import {StreamElementsSocketClient} from "@chimera/streamelements/client/socket/client";

@Injectable()
export class StreamElementsSocketClientManager {

    private readonly logger: Logger = new Logger(StreamElementsSocketClientManager.name);

    private readonly clients: Map<string, StreamElementsSocketClient> = new Map();

    constructor(
        private readonly emitter: EventEmitter2,
        private readonly streamElementsRepository: StreamElementsRepository,
    ) {}

    async createClient(accountId: string): Promise<void> {
        const streamElements: StreamElements = await this.streamElementsRepository.getByAccountId(accountId);
        const jwt: string = streamElements.jwt ?? ((): string => {
            throw new Error(`StreamElements Account '${accountId}' does not have Authorization token.`);
        })();

        const client: StreamElementsSocketClient = StreamElementsSocketClient.createInstance(this.emitter, accountId, jwt);
        client.connect();

        this.clients.set(accountId, client);
    }

    async destroyClient(accountId: string): Promise<void> {
        const client: StreamElementsSocketClient = this.clients.get(accountId) ?? ((): StreamElementsSocketClient => {
            throw new Error(`StreamElements Socket Client fo Account '${accountId}' does not exist.`);
        })();
        client.disconnect();

        this.clients.delete(accountId);
    }

}
