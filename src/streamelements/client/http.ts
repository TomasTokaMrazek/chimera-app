import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../../axios";

import configuration from "../../configuration";

const streamElementsApi: string = configuration.streamElements.apiUrl;

class StreamElementsHttpClient {

    private constructor(
        private readonly jwt: string
    ) {
    }

    static createInstance(jwt: string): StreamElementsHttpClient {
        return new StreamElementsHttpClient(jwt);
    }


    public getCurrentUser(): Promise<AxiosResponse<CurrentUserRequest>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return axiosInstance.get(`${streamElementsApi}/users/current`, config);
    }

    public getCurrentUserChannel(): Promise<AxiosResponse<CurrentUserChannel>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return axiosInstance.get(`${streamElementsApi}/channels/me`, config);
    }

    public getTips(channel: string, queryParams: TipListRequestParams): Promise<AxiosResponse<TipListResponse>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            },
            params: queryParams
        };

        return axiosInstance.get(`${streamElementsApi}/tips/${channel}`, config);
    }

    public createTip(channel: string, body: TipRequest): Promise<AxiosResponse<any>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return axiosInstance.post(`${streamElementsApi}/tips/${channel}`, body, config);
    }

    public getTip(channel: string, tipId: string): Promise<AxiosResponse<any>> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.jwt}`
            }
        };

        return axiosInstance.get(`${streamElementsApi}/tips/${channel}/${tipId}`, config);
    }

}

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
    totalDocs?: number;
    offset?: number;
    limit?: number;
    totalPages?: number;
    page?: number;
    pagingCounter?: number;
    hasPrevPage?: boolean;
    hasNextPage?: boolean;
    prevPage?: number;
    nextPage?: number;
}

export interface TipListDoc {
    donation: TipListDonation;
    _id: number;
    channel?: string;
    provider?: string;
    approved?: string;
    status?: string;
    source?: string;
    deleted?: string;
    createdAt?: string;
    updatedAt?: string;
    transactionId?: string;
}

export interface TipListDonation {
    user: TipListDonationUser;
    message?: string;
    amount?: number;
    currency?: string;
    paymentMethod?: string;
}

export interface TipListDonationUser {
    username?: string;
    geo?: string;
    email?: string;
    channel?: string;
}

export default StreamElementsHttpClient;
