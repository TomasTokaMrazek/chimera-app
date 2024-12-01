import {User} from "@chimera/prisma/client";

export interface IdView {
    id: number;
}

export interface AccountIdView {
    account_id: string;
}

export interface UserView {
    user: User | null;
}
