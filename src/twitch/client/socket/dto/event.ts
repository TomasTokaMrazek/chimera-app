export interface ChannelChatMessage {
    broadcaster_user_id: string,
    broadcaster_user_name: string,
    broadcaster_user_login: string,
    chatter_user_id: string,
    chatter_user_name: string,
    chatter_user_login: string,
    message_id: string,
    message: ChannelChatMessageMessage,
    message_type: ChannelChatMessageMessageType,
    badges: ChannelChatMessageBadge[],
    cheer?: ChannelChatMessageCheer,
    color: string,
    reply?: ChannelChatMessageReply
    channel_points_custom_reward_id?: string,
    channel_points_animation_id?: string
}

export interface ChannelChatMessageMessage {
    text: string,
    fragments: ChannelChatMessageMessageFragment[]
}

export interface ChannelChatMessageMessageFragment {
    type: ChannelChatMessageMessageFragmentType,
    text: string,
    cheermote?: ChannelChatMessageMessageFragmentCheermote,
    emote?: ChannelChatMessageMessageFragmentEmote,
    mention?: ChannelChatMessageMessageFragmentMention
}

export enum ChannelChatMessageMessageFragmentType {
    TEXT = "text",
    CHEERMOTE = "cheermote",
    EMOTE = "emote",
    MENTION = "mention"
}

export interface ChannelChatMessageMessageFragmentCheermote {
    prefix: string,
    bits: number,
    tier: number
}

export interface ChannelChatMessageMessageFragmentEmote {
    id: string,
    emote_set_id: string,
    owner_id: string,
    format: string[]
}

export interface ChannelChatMessageMessageFragmentMention {
    user_id: string,
    user_name: string,
    user_login: string
}

export enum ChannelChatMessageMessageType {
    TEXT = "text",
    CHANNEL_POINTS_HIGHLIGHTED = "channel_points_highlighted",
    CHANNEL_POINTS_SUB_ONLY = "channel_points_sub_only",
    USER_INTRO = "user_intro",
    POWER_UPS_MESSAGE_EFFECT = "power_ups_message_effect",
    POWER_UPS_GIGANTIFIED_EMOTE = "power_ups_gigantified_emote"
}

export interface ChannelChatMessageBadge {
    set_id: string,
    id: string,
    info: string
}

export interface ChannelChatMessageCheer {
    bits: number;
}

export interface ChannelChatMessageReply {
    parent_message_id: string,
    parent_message_body: string,
    parent_user_id: string,
    parent_user_name: string,
    parent_user_login: string,
    thread_message_id: string,
    thread_user_id: string,
    thread_user_name: string,
    thread_user_login: string
}
