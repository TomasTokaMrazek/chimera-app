import {Injectable, Logger} from "@nestjs/common";
import {HttpService} from "@nestjs/axios";
import {EventEmitter2, OnEvent} from "@nestjs/event-emitter";

import {StreamLabsRepository} from "@chimera/streamlabs/repository/repository";
import {StreamLabs} from "@prisma/client";

import {StreamLabsSocketClient} from "@chimera/streamlabs/client/socket/client";

@Injectable()
export class StreamLabsSocketClientManager {

    private readonly logger: Logger = new Logger(StreamLabsSocketClientManager.name);

    private readonly clients: Map<string, StreamLabsSocketClient> = new Map<string, StreamLabsSocketClient>();

    constructor(
        private readonly httpService: HttpService,
        private readonly emitter: EventEmitter2,
        private readonly streamLabsRepository: StreamLabsRepository,
    ) {}

    async createSocketClient(accountId: string): Promise<void> {
        const streamLabs: StreamLabs = await this.streamLabsRepository.getByAccountId(accountId);
        const socketToken: string = streamLabs.socket_token ?? ((): string => {
            throw new Error(`StreamLabs Account '${accountId}' does not have Authorization token`);
        })();

        const client: StreamLabsSocketClient = StreamLabsSocketClient.createInstance(this.emitter, socketToken, accountId);

        this.clients.set(accountId, client);
        client.connect();
    }

    async destroySocketClient(accountId: string): Promise<void> {
        const client: StreamLabsSocketClient = this.clients.get(accountId) ?? ((): StreamLabsSocketClient => {
            throw new Error(`StreamLabs Socket Client fo Account '${accountId}' does not exist.`);
        })();

        this.clients.delete(accountId);
        client.disconnect();
    }

}
