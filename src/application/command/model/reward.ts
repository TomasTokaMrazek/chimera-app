import {ApiClient, HelixCustomReward, HelixCustomRewardRedemption, HelixUser} from "@twurple/api";
import {chunkArray} from "@chimera/utils/array";
import {Injectable, Logger} from "@nestjs/common";
import {TwitchService} from "@chimera/twitch/service";
import {WheelService} from "@chimera/application/utils/wheel/service";
import {z} from "zod";
import {Argv, CommandModule} from "yargs";

export const RewardCommandArgumentOperation = z.enum([
    "create",
    "draw",
    "close"
]);
export type RewardCommandArgumentOperationType = z.infer<typeof RewardCommandArgumentOperation>;

export const RewardCommandOptionTwitchUser = z.enum([
    "exists",
    "follower",
    "subscriber"
]);
export type RewardCommandOptionTwitchUserType = z.infer<typeof RewardCommandOptionTwitchUser>;

export const RewardCommandOptionTwitch = z.object({
    user: RewardCommandOptionTwitchUser.optional().default(RewardCommandOptionTwitchUser.enum.exists)
});
export type RewardCommandOptionTwitchType = z.infer<typeof RewardCommandOptionTwitch>;

export const RewardCommandCreateOptions = z.object({
    operation: z.literal(RewardCommandArgumentOperation.enum.create),
    title: z.string(),
    prompt: z.string(),
    cost: z.number().int()
});
export type RewardCommandCreateOptionsType = z.infer<typeof RewardCommandCreateOptions>;

export const RewardCommandOptionTarget = z.enum([
    "wheel",
    "pastebin"
]);
export type RewardCommandOptionTargetType = z.infer<typeof RewardCommandOptionTarget>;

export const RewardCommandDrawOptions = z.object({
    operation: z.literal(RewardCommandArgumentOperation.enum.draw),
    id: z.uuid(),
    twitch: RewardCommandOptionTwitch,
    unique: z.boolean().optional().default(true),
    target: RewardCommandOptionTarget.optional().default(RewardCommandOptionTarget.enum.wheel)
});
export type RewardCommandDrawOptionsType = z.infer<typeof RewardCommandDrawOptions>;

export const RewardCommandCloseOptions = z.object({
    operation: z.literal(RewardCommandArgumentOperation.enum.close),
    id: z.uuid(),
    twitch: RewardCommandOptionTwitch,
    unique: z.boolean().optional().default(true),
});
export type RewardCommandCloseOptionsType = z.infer<typeof RewardCommandCloseOptions>;

export const RewardCommandOptions = z.discriminatedUnion("operation", [
    RewardCommandCreateOptions,
    RewardCommandDrawOptions,
    RewardCommandCloseOptions,
]);
export type RewardCommandOptionsType = z.infer<typeof RewardCommandOptions>;

export interface RewardUser {
    username: string;
    color: string | null;
}

@Injectable()
export class RewardService {

    private readonly logger: Logger = new Logger(RewardService.name);

    constructor(
        private readonly wheelService: WheelService,
        private readonly twitchService: TwitchService
    ) {}

    getCommand(): CommandModule<any, RewardCommandOptionsType> {
        return {
            command: "reward <operation>",
            describe: "reward command",
            builder: (yargs: Argv<any>): Argv<any> =>
                yargs
                    .positional("operation", {
                        choices: RewardCommandArgumentOperation.options,
                        demandOption: true,
                        describe: "operation"
                    })
                    .option("id", {
                        type: "string",
                        describe: "Custom Reward UUID"
                    })
                    .option("title", {
                        type: "string",
                        describe: "Custom Reward Title"
                    })
                    .option("prompt", {
                        type: "string",
                        describe: "Custom Reward Prompt"
                    })
                    .option("cost", {
                        type: "number",
                        describe: "Redemption cost"
                    })
                    .option("twitch", {
                        type: "array",
                        describe: "Twitch Options (user)",
                        coerce: (option: string[]): Record<string, string> => {
                            const result: Record<string, string> = {};
                            for (const part of option) {
                                const [key, value] = part.split("=");
                                if (key && value) {
                                    result[key] = value;
                                }
                            }
                            return result;
                        }
                    })
                    .option("unique", {
                        type: "boolean",
                        describe: "Unique usernames"
                    })
                    .option("target", {
                        choices: RewardCommandOptionTarget.options,
                        describe: "Draw target"
                    }),
            handler: (argv: RewardCommandOptionsType): void => {
                this.logger.log(`argv: ${JSON.stringify(argv)}`);
            }
        };
    }

    async execute(broadcasterId: string, options: RewardCommandOptionsType): Promise<string> {
        this.logger.log(options);

        const optionOperation = options.operation;
        this.logger.log(optionOperation);

        await this.twitchService.login(broadcasterId);

        const apiClient: ApiClient = await this.twitchService.getApiClient();
        const broadcaster: HelixUser = await apiClient.users.getUserById(broadcasterId) ?? ((): HelixUser => {
            throw new Error(`Twitch Account broadcasterId '${broadcasterId}' not found.`);
        })();

        switch (optionOperation) {
            case RewardCommandArgumentOperation.enum.create: {
                const optionTitle: string = options.title;
                this.logger.log(optionTitle);

                const optionPrompt: string = options.prompt;
                this.logger.log(optionPrompt);

                const optionCost: number = options.cost;
                this.logger.log(optionCost);

                return await this.create(broadcaster, optionTitle, optionPrompt, optionCost);
            }
            case RewardCommandArgumentOperation.enum.draw: {
                const optionId: string = options.id;
                this.logger.log(optionId);

                const optionTwitch: RewardCommandOptionTwitchType = options.twitch;
                this.logger.log(optionTwitch);

                const optionUnique: boolean = options.unique;
                this.logger.log(optionUnique);

                const optionTarget: RewardCommandOptionTargetType = options.target;
                this.logger.log(optionTarget);

                return await this.draw(broadcaster, optionId, optionTwitch, optionUnique, optionTarget);
            }
            case RewardCommandArgumentOperation.enum.close: {
                const optionId: string = options.id;
                this.logger.log(optionId);

                const optionTwitch: RewardCommandOptionTwitchType = options.twitch;
                this.logger.log(optionTwitch);

                const optionUnique: boolean = options.unique;
                this.logger.log(optionUnique);

                return await this.close(broadcaster, optionId, optionTwitch, optionUnique);
            }
            default: {
                throw new Error();
            }
        }

    }

    async create(broadcaster: HelixUser, rewardTitle: string, rewardPrompt: string, redemptionCost: number): Promise<string> {
        const apiClient: ApiClient = await this.twitchService.getApiClient();

        const reward: HelixCustomReward = await apiClient.channelPoints.createCustomReward(broadcaster, {
            title: rewardTitle,
            prompt: rewardPrompt,
            cost: redemptionCost,
            maxRedemptionsPerUserPerStream: 1
        })

        return `Reward created with id '${reward.id}'.`;
    }

    async draw(broadcaster: HelixUser, rewardId: string, twitch: RewardCommandOptionTwitchType, unique: boolean, target: RewardCommandOptionTargetType): Promise<string> {
        const apiClient: ApiClient = await this.twitchService.getApiClient();

        const reward: HelixCustomReward = await apiClient.channelPoints.updateCustomReward(broadcaster, rewardId, {
            isPaused: true
        });

        const redemptions: HelixCustomRewardRedemption[] = await apiClient.channelPoints.getRedemptionsForBroadcasterPaginated(broadcaster, reward.id, "UNFULFILLED", {}).getAll();

        let users: RewardUser[] = redemptions.map((redemption: HelixCustomRewardRedemption): RewardUser => ({
            username: redemption.userDisplayName,
            color: null
        }));

        if (twitch) {
            users = await this.twitch(broadcaster, users, twitch.user);
        }

        if (unique) {
            users = users.filter((user: RewardUser, index: number, self: RewardUser[]): boolean =>
                self.findIndex((u: RewardUser): any => u.username === user.username) === index
            );
        }

        let url: string;
        switch (target) {
            case "wheel": {
                const displayName: string = broadcaster.displayName;
                const profilePictureUrl: string = broadcaster.profilePictureUrl;

                this.logger.log(`ProfilePictureUrl: ${profilePictureUrl}`);

                url = await this.wheelService.generate(displayName, profilePictureUrl, users);
                break;
            }
            case "pastebin": {
                throw new Error();
            }
            default: {
                throw new Error();
            }
        }

        return `Reward draw at ${url} with ${users.length} redemptions.`;
    }

    async close(broadcaster: HelixUser, rewardId: string, optionTwitch: RewardCommandOptionTwitchType, unique: boolean): Promise<string> {
        const apiClient: ApiClient = await this.twitchService.getApiClient();

        // 1) disable the reward
        const reward: HelixCustomReward = await apiClient.channelPoints.updateCustomReward(broadcaster, rewardId, {
            isEnabled: false
        });

        // 2) fetch all UNFULFILLED redemptions
        const redemptions: HelixCustomRewardRedemption[] = await apiClient.channelPoints.getRedemptionsForBroadcasterPaginated(broadcaster, reward.id, "UNFULFILLED", {}).getAll();

        // 3) group redemptions by userId
        const userRedemptions = new Map<string, HelixCustomRewardRedemption[]>();
        for (const redemption of redemptions) {
            const existingUserRedemptions: HelixCustomRewardRedemption[] = userRedemptions.get(redemption.userId) ?? [];
            existingUserRedemptions.push(redemption);
            userRedemptions.set(redemption.userId, existingUserRedemptions);
        }

        // 4) bulk-fetch HelixUser for each unique userId
        const userIdChunks: string[][] = chunkArray(Array.from(userRedemptions.keys()), 100);
        const helixUsers: HelixUser[] = [];
        for (const chunk of userIdChunks) {
            const usersFromApi: HelixUser[] = await apiClient.users.getUsersByIds(chunk);
            helixUsers.push(...usersFromApi);
        }

        // 5) run filter once per user
        const passesMap = new Map<string, boolean>();
        for (const helixUser of helixUsers) {
            let passes: boolean = false;
            switch (optionTwitch.user) {
                case RewardCommandOptionTwitchUser.enum.exists: {
                    passes = true;
                    break;
                }
                case RewardCommandOptionTwitchUser.enum.follower: {
                    passes = await broadcaster.isFollowedBy(helixUser);
                    break;
                }
                case RewardCommandOptionTwitchUser.enum.subscriber: {
                    passes = await broadcaster.hasSubscriber(helixUser);
                    break;
                }
            }
            passesMap.set(helixUser.id, passes);
        }

        // 6) split into toFulfill / toCancel, applying `unique` per displayName
        const toFulfill: HelixCustomRewardRedemption[] = [];
        const toCancel: HelixCustomRewardRedemption[] = [];
        const seenNames = new Set<string>();

        for (const helixUser of helixUsers) {
            const group: HelixCustomRewardRedemption[] = userRedemptions.get(helixUser.id)!;
            const passes: boolean = passesMap.get(helixUser.id) ?? false;

            for (const redemption of group) {
                if (passes) {
                    if (unique) {
                        if (seenNames.has(helixUser.displayName)) {
                            toCancel.push(redemption);
                        } else {
                            seenNames.add(helixUser.displayName);
                            toFulfill.push(redemption);
                        }
                    } else {
                        toFulfill.push(redemption);
                    }
                } else {
                    toCancel.push(redemption);
                }
            }
        }

        // 7) update statuses in parallel
        await Promise.all([
            ...toFulfill.map((redemption: HelixCustomRewardRedemption): any => redemption.updateStatus("FULFILLED")),
            ...toCancel.map((redemption: HelixCustomRewardRedemption): any => redemption.updateStatus("CANCELED"))
        ]);

        // 6) Build a reply
        return `Reward closed with ${toFulfill.length} fulfilled and ${toCancel.length} cancelled redemptions.`;
    }

    async twitch(broadcaster: HelixUser, users: RewardUser[], twitchUser: RewardCommandOptionTwitchUserType): Promise<RewardUser[]> {
        const filteredUsers: RewardUser[] = [];

        const apiClient: ApiClient = await this.twitchService.getApiClient();

        const validUsers: string[] = users
            .map((user: RewardUser): string => user.username)
            .filter((user: string): boolean => /^(?!_)\w{3,25}$/.test(user));

        const userChunks: string[][] = chunkArray(validUsers, 100);
        const helixUsers: HelixUser[] = [];
        for (const chunk of userChunks) {
            const usersFromApi: HelixUser[] = await apiClient.users.getUsersByNames(chunk);
            helixUsers.push(...usersFromApi);
        }

        const helixUserChunks: HelixUser[][] = chunkArray(helixUsers, 100);
        const helixUserColors: Map<string, string | null> = new Map();
        for (const chunk of helixUserChunks) {
            const colorsFromApi: Map<string, string | null> = await apiClient.chat.getColorsForUsers(chunk);
            colorsFromApi.forEach((value: string | null, key: string): void => {
                helixUserColors.set(key, value);
            });
        }

        const passEntries: Array<[HelixUser, Promise<boolean>]> = [];
        for (const validUser of validUsers) {
            const helixUser: HelixUser | undefined = helixUsers.find((user: HelixUser): boolean => user.displayName === validUser);
            if (!helixUser) {
                continue;
            }

            let passPromise: Promise<boolean>;
            switch (twitchUser) {
                case RewardCommandOptionTwitchUser.enum.exists: {
                    passPromise = Promise.resolve(true);
                    break;
                }
                case RewardCommandOptionTwitchUser.enum.follower: {
                    passPromise = broadcaster.isFollowedBy(helixUser);
                    break;
                }
                case RewardCommandOptionTwitchUser.enum.subscriber: {
                    passPromise = broadcaster.hasSubscriber(helixUser);
                    break;
                }
            }
            passEntries.push([helixUser, passPromise]);
        }

        const passResults: boolean[] = await Promise.all(passEntries.map(([_,p]) => p));

        for (let i: number = 0; i < passEntries.length; i++) {
            if (!passResults[i]) continue;

            const [helixUser] = passEntries[i];
            filteredUsers.push({
                username: helixUser.displayName,
                color:    helixUserColors.get(helixUser.id) ?? null
            });
        }

        return filteredUsers;
    }

}
