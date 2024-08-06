export interface TokenCodeRequestBody {
    grant_type: string,
    code: string,
    redirect_uri: string,
    client_id: string,
    client_secret: string
}

export interface TokenCodeResponseBody {
    access_token: string,
    token_type: string,
    expires_in: string,
    refresh_token: string,
    scope: string
}

export interface TokenRefreshRequestBody {
    grant_type: string,
    refresh_token: string,
    client_id: string,
    client_secret: string
}

export interface TokenRefreshResponseBody {
    access_token: string,
    token_type: string,
    expires_in: string,
    refresh_token: string,
    scope: string
}

export interface TokenValidationResponseBody {
    client_id: string,
    login: string,
    scopes: string[],
    user_id: string,
    expires_in: number
}

export interface UserInfoResponseBody {
    aud: string,
    exp: number,
    iat: number,
    iss: string,
    sub: string,
    azp: string,
    preferred_username: string
}
