import {createZodDto} from "nestjs-zod";
import {z} from "zod";

export const EventSyncService = z.enum([
    "STREAMELEMENTS",
    "STREAMLABS"
]);
export type EventSyncServiceType = z.infer<typeof EventSyncService>;

export const EventSync = z.object({
    from: EventSyncService,
    to: EventSyncService
}).refine((data): boolean => data.from !== data.to, {
    message: "The 'from' and 'to' fields must be different."
});
export type EventSyncType = z.infer<typeof EventSync>;
export class EventSyncDto extends createZodDto(EventSync) {}

export const EventSyncRequest = z.object({
    twitchAccountId: z.string().min(1),
    sync: EventSync
});
export type EventSyncRequestType = z.infer<typeof EventSyncRequest>;
export class EventSyncRequestDto extends createZodDto(EventSyncRequest) {}
