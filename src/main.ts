import {NestFactory} from "@nestjs/core";

import {AppModule} from "./app.module";

import configuration from "@chimera/configuration";

const port: number = configuration.app.port;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(port);
}

bootstrap();
