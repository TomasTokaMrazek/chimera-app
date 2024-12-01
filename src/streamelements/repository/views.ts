import {User} from "@chimera/prisma/client";

export interface IdView {
    id: number;
}

export interface UserView {
    user: User | null;
}
