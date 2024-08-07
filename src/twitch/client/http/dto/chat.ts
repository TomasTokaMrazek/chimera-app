export interface GetUsersChatColorRequestParams {
    user_id: string[]
}

export interface GetUsersChatColorResponseBody {
    data: GetUsersChatColorResponseData[]
}

export interface GetUsersChatColorResponseData {
    user_id: string,
    user_login: string,
    user_name: string,
    color: string
}

export interface SendChatMessageRequestBody {
    broadcaster_id: string,
    sender_id: string,
    message: string,
    reply_parent_message_id?: string
}

export interface SendChatMessageResponseBody {
    data: SendChatMessageResponseData[]
}

export interface SendChatMessageResponseData {
    message_id: string,
    is_sent: boolean,
    drop_reason: {
        code: string,
        message: string
    }
}
