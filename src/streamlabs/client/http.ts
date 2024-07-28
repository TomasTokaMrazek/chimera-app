import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../../axios";

import configuration from "../../configuration";

const streamLabsApiUrl: string = configuration.streamLabs.apiUrl;

const redirectUri: string = configuration.streamLabs.redirectUrl;
const clientID: string = configuration.streamLabs.clientId;
const clientSecret: string = configuration.streamLabs.clientSecret;

class StreamLabsHttpClient {

    private constructor(
        private readonly accessToken: string
    ) {
    }

    static createInstance(accessToken: string): StreamLabsHttpClient {
        return new StreamLabsHttpClient(accessToken);
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

        return axiosInstance.post(`${streamLabsApiUrl}/token`, data, config);
    }

    public getSocketToken(): Promise<AxiosResponse<SocketTokenResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return axiosInstance.get(`${streamLabsApiUrl}/socket/token`, config);
    }

    public getUser(): Promise<AxiosResponse<UserResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return axiosInstance.get(`${streamLabsApiUrl}/user`, config);
    }

    public getDonations(): Promise<AxiosResponse<DonationListResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return axiosInstance.get(`${streamLabsApiUrl}/donations`, config);
    }

    public createDonation(body: DonationRequest): Promise<AxiosResponse<DonationResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.accessToken}`
            }
        };

        return axiosInstance.post(`${streamLabsApiUrl}/donations`, config);
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

export interface SocketTokenResponse {
    socket_token: string;
}

export interface UserResponse {
    streamlabs: User;
    twitch: User;
}

export interface User {
    id: number,
    display_name: string
}

export interface DonationListResponse {
    data: DonationList[];
}

export interface DonationList {
    donation_id: number,
    name: string,
    message: string,
    email: string
    currency: string,
    amount: string,
    created_at: number
}

export interface DonationRequest {
    name: string,
    message: string,
    identifier: string,
    currency: string,
    amount: number
}

export interface DonationResponse {
    donation_id: number;
}

export default StreamLabsHttpClient;
