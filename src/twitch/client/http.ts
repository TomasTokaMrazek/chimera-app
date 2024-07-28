import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../../axios";

import configuration from "../../configuration";

const twitchOauthUrl: string = configuration.twitch.oauthUrl;
const redirectUri: string = configuration.twitch.redirectUrl;
const clientID: string = configuration.twitch.clientId;
const clientSecret: string = configuration.twitch.clientSecret;

class TwitchHttpClient {

    private constructor(
        private readonly accessToken: string
    ) {
    }

    static createInstance(accessToken: string): TwitchHttpClient {
        return new TwitchHttpClient(accessToken);
    }


    public getOauthTokens(authorizationCode: string): Promise<AxiosResponse<TokenResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const data: TokenRequestParams = {
            "grant_type": "authorization_code",
            "code": authorizationCode,
            "redirect_uri": redirectUri,
            "client_id": clientID,
            "client_secret": clientSecret
        };

        return axiosInstance.post(`${twitchOauthUrl}/token`, data, config);
    }

    public getOauthUser(): Promise<AxiosResponse<UserResponse>> {
        const config: {} = {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return axiosInstance.get(`${twitchOauthUrl}/userinfo`, config);
    }

}

export interface TokenRequestParams {
    grant_type: string,
    code: string,
    redirect_uri: string,
    client_id: string,
    client_secret: string
}

export interface TokenResponse {
    access_token: string,
    token_type: string,
    expires_in: string,
    refresh_token: string,
    scope: string
}

export interface UserResponse {
    aud: string,
    exp: number,
    iat: number,
    iss: string,
    sub: string,
    azp: string,
    preferred_username: string
}

export default TwitchHttpClient;
