import dotenv from "dotenv";
import config from "config";

dotenv.config();

function getEnvVariable(name: string): string {
    const value: string | undefined = process.env[name];
    if (value === undefined) {
        throw new Error(`Environment variable ${name} is undefined.`);
    }
    return value;
}

interface App {
    url: string;
    port: number;
}

interface StreamElements {
    apiUrl: string;
    websocketUrl: string;
}

interface StreamLabs {
    apiUrl: string;
    websocketUrl: string;
    redirectUrl: string;
    clientId: string;
    clientSecret: string;
}

interface Configuration {
    app: App;
    streamElements: StreamElements;
    streamLabs: StreamLabs;
}

const app: App = {
    url: config.get("app.url"),
    port: config.get("app.port")
};

const streamElements: StreamElements = {
    apiUrl: config.get("streamElements.apiUrl"),
    websocketUrl: config.get("streamElements.websocketUrl")
};

const streamLabs: StreamLabs = {
    apiUrl: config.get("streamLabs.apiUrl"),
    websocketUrl: config.get("streamLabs.websocketUrl"),
    redirectUrl: config.get("streamLabs.redirectUrl"),
    clientId: getEnvVariable("STREAMLABS_CLIENT_ID"),
    clientSecret: getEnvVariable("STREAMLABS_CLIENT_SECRET")
};

const configuration: Configuration = {
    app: app,
    streamElements: streamElements,
    streamLabs: streamLabs
};

export default configuration;
