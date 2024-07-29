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

interface Twitch {
    oauthUrl: string;
    apiUrl: string;
    websocketUrl: string;
    redirectUrl: string;
    clientId: string;
    clientSecret: string;
}

interface StreamElements {
    oauthUrl: string;
    apiUrl: string;
    websocketUrl: string;
    redirectUrl: string;
    clientId: string;
    clientSecret: string;
}

interface StreamLabs {
    oauthUrl: string;
    apiUrl: string;
    websocketUrl: string;
    redirectUrl: string;
    clientId: string;
    clientSecret: string;
}

interface WheelOfNames {
    apiUrl: string;
    apiKey: string;
}

interface Configuration {
    app: App;
    twitch: Twitch;
    streamElements: StreamElements;
    streamLabs: StreamLabs;
    wheelOfNames: WheelOfNames;
}

const app: App = {
    url: config.get("app.url"),
    port: config.get("app.port")
};

const twitch: Twitch = {
    oauthUrl: config.get("twitch.oauthUrl"),
    apiUrl: config.get("twitch.apiUrl"),
    websocketUrl: config.get("twitch.websocketUrl"),
    redirectUrl: config.get("twitch.redirectUrl"),
    clientId: getEnvVariable("TWITCH_CLIENT_ID"),
    clientSecret: getEnvVariable("TWITCH_CLIENT_SECRET")
};


const streamElements: StreamElements = {
    oauthUrl: config.get("streamElements.oauthUrl"),
    apiUrl: config.get("streamElements.apiUrl"),
    websocketUrl: config.get("streamElements.websocketUrl"),
    redirectUrl: config.get("streamElements.redirectUrl"),
    clientId: getEnvVariable("STREAMELEMENTS_CLIENT_ID"),
    clientSecret: getEnvVariable("STREAMELEMENTS_CLIENT_SECRET")
};

const streamLabs: StreamLabs = {
    oauthUrl: config.get("streamLabs.oauthUrl"),
    apiUrl: config.get("streamLabs.apiUrl"),
    websocketUrl: config.get("streamLabs.websocketUrl"),
    redirectUrl: config.get("streamLabs.redirectUrl"),
    clientId: getEnvVariable("STREAMLABS_CLIENT_ID"),
    clientSecret: getEnvVariable("STREAMLABS_CLIENT_SECRET")
};

const wheelOfNames: WheelOfNames = {
    apiUrl: config.get("wheelOfNames.apiUrl"),
    apiKey: getEnvVariable("WHEELOFNAMES_API_KEY")
};

const configuration: Configuration = {
    app: app,
    twitch: twitch,
    streamElements: streamElements,
    streamLabs: streamLabs,
    wheelOfNames: wheelOfNames
};

export default configuration;
