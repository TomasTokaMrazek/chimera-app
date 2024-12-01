import {NestFactory} from "@nestjs/core";
import {INestApplication} from "@nestjs/common";

import {AppModule} from "./app.module";

import configuration from "@chimera/configuration";

const port: number = configuration.app.port;

async function bootstrap(): Promise<void> {
    const app: INestApplication = await NestFactory.create(AppModule);
    await app.listen(port);
}

bootstrap();
