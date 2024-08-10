export interface ServerToClientEvents {
    event: (event: TipEvent) => void;
}

export interface TipEvent {
    type: string;
    message: any;
    event_id: string;
}

export interface TipEventMessage {
    id: number;
    name: string;
    currency: string;
    amount: number;
    formatted_amount: string;
    message?: string;
}
