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
