export interface CreateEventSubSubscriptionRequestBody {
    type: string,
    version: string,
    condition: object,
    transport: EventSubSubscriptionTransport
}

export interface CreateEventSubSubscriptionResponseBody {
    data: CreateEventSubSubscriptionData[],
    total: number,
    total_cost: number,
    max_total_cost: number
}

export interface DeleteEventSubSubscriptionRequestParams {
    id: string;
}

export interface GetEventSubSubscriptionRequestParams {
    status?: string,
    type?: string,
    user_id?: string,
    after?: string
}

export interface GetEventSubSubscriptionResponseBody {
    data: CreateEventSubSubscriptionData[],
    total: number,
    total_cost: number,
    max_total_cost: number,
    pagination: CreateEventSubSubscriptionPagination
}

export interface CreateEventSubSubscriptionData {
    id: string,
    status: string,
    type: string,
    version: string,
    condition: object,
    created_at: string,
    transport: EventSubSubscriptionTransport,
    cost: number
}

export interface CreateEventSubSubscriptionPagination {
    cursor: string;
}

export interface DeleteEventSubSubscriptionRequestParams {
    id: string;
}

export interface EventSubSubscriptionTransport {
    method: EventSubSubscriptionTransportMethod,
    callback?: string,
    secret?: string,
    session_id?: string,
    connected_at?: string,
    disconnected_at?: string,
    conduit_id?: string
}

export enum EventSubSubscriptionTransportMethod {
    WEBHOOK = "webhook",
    WEBSOCKET = "websocket",
    CONDUIT = "conduit"
}




