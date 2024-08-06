// Welcome
export interface WelcomeMessage {
    metadata: WelcomeMessageMetadata,
    payload: WelcomeMessagePayload
}

export interface WelcomeMessageMetadata {
    message_id: string,
    message_type: string,
    message_timestamp: string
}

export interface WelcomeMessagePayload {
    session: WelcomeMessagePayloadSession;
}

export interface WelcomeMessagePayloadSession {
    id: string,
    status: string,
    keepalive_timeout_seconds: number,
    reconnect_url: string,
    connected_at: string
}

// Keepalive
export interface KeepaliveMessage {
    metadata: KeepaliveMessageMetadata,
    payload: KeepaliveMessagePayload
}

export interface KeepaliveMessageMetadata {
    message_id: string,
    message_type: string,
    message_timestamp: string
}

export interface KeepaliveMessagePayload {

}

// Reconnect
export interface ReconnectMessage {
    metadata: ReconnectMessageMetadata,
    payload: ReconnectMessagePayload
}

export interface ReconnectMessageMetadata {
    message_id: string,
    message_type: string,
    message_timestamp: string
}

export interface ReconnectMessagePayload {
    session: ReconnectMessagePayloadSession;
}

export interface ReconnectMessagePayloadSession {
    id: string,
    status: string,
    keepalive_timeout_seconds: number,
    reconnect_url: string,
    connected_at: string
}

// Notification
export interface NotificationMessage {
    metadata: NotificationMessageMetadata,
    payload: NotificationMessagePayload
    event: object
}

export interface NotificationMessageMetadata {
    message_id: string,
    message_type: string,
    message_timestamp: string,
    subscription_type: string,
    subscription_version: string
}

export interface NotificationMessagePayload {
    subscription: NotificationMessagePayloadSubscription;
}

export interface NotificationMessagePayloadSubscription {
    id: string,
    status: string,
    type: string,
    version: string,
    cost: number,
    condition: object,
    transport: NotificationMessagePayloadSubscriptionTransport,
    created_at: string
}

export interface NotificationMessagePayloadSubscriptionTransport {
    method: string,
    session_id: string
}

// Revocation
export interface RevocationMessage {
    metadata: RevocationMessageMetadata,
    payload: RevocationMessagePayload
}

export interface RevocationMessageMetadata {
    message_id: string,
    message_type: string,
    message_timestamp: string,
    subscription_type: string,
    subscription_version: string
}

export interface RevocationMessagePayload {
    subscription: RevocationMessagePayloadSubscription;
}

export interface RevocationMessagePayloadSubscription {
    id: string,
    status: string,
    type: string,
    version: string,
    cost: number,
    condition: object,
    transport: RevocationMessagePayloadSubscriptionTransport,
    created_at: string
}

export interface RevocationMessagePayloadSubscriptionTransport {
    method: string,
    session_id: string
}
