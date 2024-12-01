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

interface ChatbotTwitch {
    userAccountId: string;
    adminAccountIds: string[];
}

interface Chatbot {
    twitch: ChatbotTwitch;
}

interface AgraelusTwitch {
    userAccountId: string;
    adminAccountIds: string[];
}

interface Agraelus {
    twitch: AgraelusTwitch;
}

interface FlygunTwitch {
    userAccountId: string;
    adminAccountIds: string[];
}

interface FlygunStreamElements {
    userAccountId: string;
}

interface Flygun {
    twitch: FlygunTwitch;
    streamElements: FlygunStreamElements;
}

interface App {
    url: string;
    port: number;
    chatbot: Chatbot;
    agraelus: Agraelus;
    flygun: Flygun;
}

interface Twitch {
    oauthUrl: string;
    apiUrl: string;
    websocketUrl: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
}

interface StreamElements {
    oauthUrl: string;
    apiUrl: string;
    websocketUrl: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
}

interface StreamLabs {
    oauthUrl: string;
    apiUrl: string;
    websocketUrl: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
}

interface WheelOfNames {
    url: string,
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

const chatbot: Chatbot = {
    twitch: {
        userAccountId: config.get("app.chatbot.twitch.userAccountId"),
        adminAccountIds: config.get("app.chatbot.twitch.adminAccountIds")
    }
};

const agraelus: Agraelus = {
    twitch: {
        userAccountId: config.get("app.agraelus.twitch.userAccountId"),
        adminAccountIds: config.get("app.agraelus.twitch.adminAccountIds")
    }
};

const flygun: Flygun = {
    twitch: {
        userAccountId: config.get("app.flygun.twitch.userAccountId"),
        adminAccountIds: config.get("app.flygun.twitch.adminAccountIds")
    },
    streamElements: {
        userAccountId: config.get("app.flygun.streamElements.userAccountId")
    }
};

const app: App = {
    url: config.get("app.url"),
    port: config.get("app.port"),
    chatbot: chatbot,
    agraelus: agraelus,
    flygun: flygun
};

const twitch: Twitch = {
    oauthUrl: config.get("twitch.oauthUrl"),
    apiUrl: config.get("twitch.apiUrl"),
    websocketUrl: config.get("twitch.websocketUrl"),
    redirectUri: config.get("twitch.redirectUri"),
    clientId: getEnvVariable("TWITCH_CLIENT_ID"),
    clientSecret: getEnvVariable("TWITCH_CLIENT_SECRET")
};


const streamElements: StreamElements = {
    oauthUrl: config.get("streamElements.oauthUrl"),
    apiUrl: config.get("streamElements.apiUrl"),
    websocketUrl: config.get("streamElements.websocketUrl"),
    redirectUri: config.get("streamElements.redirectUri"),
    clientId: getEnvVariable("STREAMELEMENTS_CLIENT_ID"),
    clientSecret: getEnvVariable("STREAMELEMENTS_CLIENT_SECRET")
};

const streamLabs: StreamLabs = {
    oauthUrl: config.get("streamLabs.oauthUrl"),
    apiUrl: config.get("streamLabs.apiUrl"),
    websocketUrl: config.get("streamLabs.websocketUrl"),
    redirectUri: config.get("streamLabs.redirectUri"),
    clientId: getEnvVariable("STREAMLABS_CLIENT_ID"),
    clientSecret: getEnvVariable("STREAMLABS_CLIENT_SECRET")
};

const wheelOfNames: WheelOfNames = {
    url: config.get("wheelOfNames.url"),
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
