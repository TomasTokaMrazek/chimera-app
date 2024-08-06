import axiosInstance, {AxiosRequestConfig, AxiosResponse} from "../../axios";

import configuration from "../../configuration";

const wheelOfNamesApiUrl: string = configuration.wheelOfNames.apiUrl;
const wheelOfNamesApiKey: string = configuration.wheelOfNames.apiKey;

class WheelOfNamesHttpClient {

    public getSavedWheels(queryParams: GetRequestQueryParams): Promise<AxiosResponse<GetResponse>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "x-api-key": wheelOfNamesApiKey
            },
            params: queryParams
        };

        return axiosInstance.get(`${wheelOfNamesApiUrl}/wheels/private`, config);
    }

    public putSavedWheel(body: PutRequest): Promise<AxiosResponse<PutResponse>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "x-api-key": wheelOfNamesApiKey
            }
        };

        return axiosInstance.put(`${wheelOfNamesApiUrl}/wheels/private`, body, config);
    }

    public deleteSavedWheel(body: DeleteRequest): Promise<AxiosResponse<void>> {
        const config: AxiosRequestConfig = {
            validateStatus: (status: number): boolean => {
                return status < 500;
            },
            headers: {
                "x-api-key": wheelOfNamesApiKey
            },
            data: body
        };

        return axiosInstance.delete(`${wheelOfNamesApiUrl}/wheels/private`, config);
    }

}

export interface GetRequestQueryParams {
    lastCreated?: number;
}

export interface GetResponse {
    data: Wheel[],
    moreWheelsAvailable: boolean
}

export interface PutRequest {
    config: WheelConfig;
}

export interface PutResponse {
    data: {
        path: string
    };
}

export interface DeleteRequest {
    title: string;
}

export interface Wheel {
    wheelConfig: WheelConfig,
    created: number,
    lastRead: number,
    lastWrite: number,
    path: string,
    readCount: number,
    shareMode: ShareMode
}

export interface WheelConfig {
    displayWinnerDialog?: boolean,
    slowSpin?: boolean,
    pageBackgroundColor?: string,
    description: string,
    animateWinner?: boolean,
    winnerMessage?: string,
    title: string,
    type?: Type,
    autoRemoveWinner?: boolean,
    customPictureName?: string,
    customCoverImageDataUri?: string,
    playClickWhenWinnerRemoved?: boolean,
    duringSpinSound?: string,
    maxNames?: number,
    centerText?: string,
    afterSpinSoundVolume?: number,
    spinTime?: number,
    hubSize?: HubSize,
    coverImageName?: string,
    entries: Entry[],
    isAdvanced?: boolean,
    galleryPicture?: string,
    customPictureDataUri?: string,
    showTitle?: boolean,
    displayHideButton?: boolean,
    afterSpinSound?: string,
    colorSettings?: ColorSettings[],
    duringSpinSoundVolume?: number,
    displayRemoveButton?: boolean,
    pictureType?: PictureType,
    allowDuplicates?: boolean,
    coverImageType?: CoverImageType,
    drawOutlines?: boolean,
    launchConfetti?: boolean
}

export interface Entry {
    text: string,
    image?: string,
    color?: string,
    weight?: number,
    id?: string
}

export interface ColorSettings {
    color: string,
    enabled: boolean
}

export enum ShareMode {
    gallery = "gallery",
    copyable = "copyable",
    spinonly = "spin-only"
}

export enum Type {
    color = "color",
    image = "image"
}

export enum HubSize {
    XS = "XS",
    S = "S",
    M = "M",
    L = "L",
    XL = "XL",
    XXL = "XXL"
}

export enum PictureType {
    none = "none",
    gallery = "gallery",
    uploaded = "uploaded",
    text = "text"
}

export enum CoverImageType {
    gallery = "gallery",
    uploaded = "uploaded"
}

export default new WheelOfNamesHttpClient();
