import dotenv from 'dotenv';
import config from 'config';

dotenv.config();

function getEnvVariable(name: string): string {
    const value: string | undefined = process.env[name];
    if (!value) {
        throw new Error(`Environment variable ${name} is required but not defined.`);
    }
    return value;
}

interface App {
    url: string;
    port: number;
}

interface StreamLabs {
    clientId: string;
    clientSecret: string;
    apiUrl: string;
    websocketUrl: string;
}

interface Configuration {
    app: App;
    streamLabs: StreamLabs;
}

const app: App = {
    url:  config.get('app.url'),
    port: config.get('app.port')
}

const streamLabs: StreamLabs = {
    clientId: getEnvVariable('STREAMLABS_CLIENT_ID'),
    clientSecret: getEnvVariable('STREAMLABS_CLIENT_SECRET'),
    apiUrl: config.get('streamLabs.apiUrl'),
    websocketUrl: config.get('streamLabs.websocketUrl')
};

const configuration: Configuration = {
    app: app,
    streamLabs: streamLabs
};

export default configuration;
