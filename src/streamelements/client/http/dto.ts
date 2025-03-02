export interface CurrentUserRequest {
    _id: string;
    channels: CurrentUserChannel[];
}

export interface CurrentUserChannel {
    _id: string;
    provider: string;
    providerId: string;
}

export interface TipRequest {
    user: TipUser;
    provider: string;
    message?: string;
    amount: number;
    currency: string;
    imported: true;
}

export interface TipUser {
    userId?: string;
    username?: string;
    email?: string;
}

export interface TipListRequestParams {
    after?: number;
    before?: number;
    email?: number;
    limit?: number;
    message?: string;
    offset?: number;
    sort?: string;
    tz?: number;
    username?: string;
}

export interface TipListResponse {
    docs: TipListDoc[];
    totalDocs: number;
    offset: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number;
    nextPage: number;
}

export interface TipListDoc {
    donation: TipListDonation;
    _id: string;
    channel?: string;
    provider?: string;
    transactionId?: string;
    approved?: string;
    status?: string;
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface TipListDonation {
    user: TipListDonationUser;
    message?: string;
    amount: number;
    currency: string;
}

export interface TipListDonationUser {
    username: string;
    geo?: string;
    email?: string;
}

export interface BotCounterUpdateRequest {
    count: number;
}

export interface BotCounter {
    id: string;
    count: number;
}
