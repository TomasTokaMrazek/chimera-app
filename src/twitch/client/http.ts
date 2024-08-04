import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../../axios";

import configuration from "../../configuration";

const twitchOauthUrl: string = configuration.twitch.oauthUrl;
const redirectUri: string = configuration.twitch.redirectUri;
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


    public getOauthTokenByCode(authorizationCode: string): Promise<AxiosResponse<TokenResponse>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const data: TokenCodeRequestParams = {
            "grant_type": "authorization_code",
            "code": authorizationCode,
            "redirect_uri": redirectUri,
            "client_id": clientID,
            "client_secret": clientSecret
        };

        return axiosInstance.post(`${twitchOauthUrl}/token`, data, config);
    }

    public getOauthTokenByRefresh(refreshToken: string): Promise<AxiosResponse<TokenResponse>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const data: TokenRefreshRequestParams = {
            "grant_type": "refresh_token",
            "refresh_token": refreshToken,
            "client_id": clientID,
            "client_secret": clientSecret
        };

        return axiosInstance.post(`${twitchOauthUrl}/token`, data, config);


    }

    public getOauthTokenValidation(): Promise<AxiosResponse<TokenValidationResponse>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return axiosInstance.get(`${twitchOauthUrl}/validate`, config);
    }

    public getOauthUser(): Promise<AxiosResponse<UserResponse>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return axiosInstance.get(`${twitchOauthUrl}/userinfo`, config);
    }

}

export interface TokenCodeRequestParams {
    grant_type: string,
    code: string,
    redirect_uri: string,
    client_id: string,
    client_secret: string
}

export interface TokenRefreshRequestParams {
    grant_type: string,
    refresh_token: string,
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

export interface TokenValidationResponse {
    client_id: string,
    login: string,
    scopes: string[],
    user_id: string,
    expires_in: number
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
