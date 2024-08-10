export interface PostRequest {
    wheelConfig: WheelConfig,
    shareMode: ShareMode
}

export interface PostResponse {
    data: {
        path: string
    }
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
    path? :string,
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
    GALLERY = "gallery",
    COPYABLE = "copyable",
    SPINONLY = "spin-only"
}

export enum Type {
    COLOR = "color",
    IMAGE = "image"
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
    NONE = "none",
    GALLERY = "gallery",
    UPLOADED = "uploaded",
    TEXT = "text"
}

export enum CoverImageType {
    GALLERY = "gallery",
    UPLOADED = "uploaded"
}
