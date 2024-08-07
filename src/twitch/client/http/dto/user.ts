export interface GetUsersRequestParams {
    id?: number[],
    login?: string[]
}

export interface GetUsersResponseBody {
    data: GetUsersResponseData[]
}

export interface GetUsersResponseData {
    id: string,
    login: string,
    display_name: string,
    type: GetUsersResponseDataType,
    broadcaster_type: GetUsersResponseDataBroadcasterType,
    description: string,
    profile_image_url: string,
    offline_image_url: string,
    view_count: number,
    email: string,
    created_at: string
}

export enum GetUsersResponseDataType {
    ADMIN = "admin",
    GLOBAL_MOD = "global_mod",
    STAFF = "staff",
    NONE = ""
}

export enum GetUsersResponseDataBroadcasterType {
    AFFILIATE = "affiliate",
    PARTNER = "partner",
    NONE = ""
}
