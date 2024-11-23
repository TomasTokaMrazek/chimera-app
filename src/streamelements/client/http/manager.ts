import {Injectable, Logger} from "@nestjs/common";

@Injectable()
export class StreamElementsHttpClientManager {

    private readonly logger: Logger = new Logger(StreamElementsHttpClientManager.name);

}
