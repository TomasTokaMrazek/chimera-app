import {getTime, parseISO, subHours} from "date-fns";
import {TipListDoc, TipListRequestParams, TipListResponse} from "@chimera/streamelements/client/http/dto";
import {StreamElementsHttpClient} from "@chimera/streamelements/client/http/client";
import {AxiosResponse} from "axios";
import {ApiClient, HelixUser} from "@twurple/api";
import {chunkArray} from "@chimera/utils/array";
import {Injectable, Logger} from "@nestjs/common";
import {TwitchService} from "@chimera/twitch/service";
import {CurrencyService} from "@chimera/application/utils/currency/service";
import {StreamElementsService} from "@chimera/streamelements/service";
import {WheelService} from "@chimera/application/utils/wheel/service";
import {StreamElementsRepository} from "@chimera/streamelements/repository/repository";
import {TwitchRepository} from "@chimera/twitch/repository/repository";
import {UserView} from "@chimera/twitch/repository/views";
import {StreamElements} from "@chimera/prisma/client";
import {z} from "zod";
import {Argv, CommandModule} from "yargs";
import {RewardCommandOptionTwitchUser, RewardUser} from "@chimera/application/command/model/reward";

export const RaffleCommandArgumentOperation = z.enum([
    "draw"
]);
export type RaffleCommandArgumentOperationType = z.infer<typeof RaffleCommandArgumentOperation>;

export const RaffleCommandOptionDonation = z.object({
    start: z.iso.datetime({offset: true, local: true}).optional().default(() => subHours(new Date(), 16).toISOString()),
    end: z.iso.datetime({offset: true, local: true}).optional().default(() => new Date().toISOString()),
    min: z.coerce.number().nonnegative().optional().default(0)
});
export type RaffleCommandOptionDonationType = z.infer<typeof RaffleCommandOptionDonation>;

export const RaffleCommandOptionTwitchUser = z.enum([
    "exists",
    "follower",
    "subscriber"
]);
export type RaffleCommandOptionTwitchUserType = z.infer<typeof RaffleCommandOptionTwitchUser>;

export const RaffleCommandOptionTwitch = z.object({
    user: RaffleCommandOptionTwitchUser.optional().default(RaffleCommandOptionTwitchUser.enum.exists)
});
export type RaffleCommandOptionTwitchType = z.infer<typeof RaffleCommandOptionTwitch>;

export const RaffleCommandOptionTarget = z.enum([
    "wheel",
    "pastebin"
]);
export type RaffleCommandOptionTargetType = z.infer<typeof RaffleCommandOptionTarget>;

export const RaffleCommandDrawOptions = z.object({
    operation: z.literal(RaffleCommandArgumentOperation.enum.draw),
    donation: RaffleCommandOptionDonation.optional(),
    twitch: RaffleCommandOptionTwitch.optional(),
    unique: z.boolean().optional().default(true),
    target: RaffleCommandOptionTarget.optional().default(RaffleCommandOptionTarget.enum.wheel)
});
export type RaffleCommandDrawOptionsType = z.infer<typeof RaffleCommandDrawOptions>;

export const RaffleCommandOptions = z.discriminatedUnion("operation", [
    RaffleCommandDrawOptions
]);
export type RaffleCommandOptionsType = z.infer<typeof RaffleCommandOptions>;

export interface RaffleUser {
    username: string;
    color: string | null;
}


@Injectable()
export class RaffleService {

    private readonly logger: Logger = new Logger(RaffleService.name);

    constructor(
        private readonly wheelService: WheelService,
        private readonly currencyService: CurrencyService,
        private readonly twitchService: TwitchService,
        private readonly twitchRepository: TwitchRepository,
        private readonly streamElementsService: StreamElementsService,
        private readonly streamElementRepository: StreamElementsRepository
    ) {}

    getCommand(): CommandModule<any, RaffleCommandOptionsType> {
        return {
            command: "raffle <operation>",
            describe: "raffle command",
            builder: (yargs: Argv<any>): Argv<any> =>
                yargs
                    .positional("operation", {
                        choices: RaffleCommandArgumentOperation.options,
                        demandOption: true,
                        describe: "operation"
                    })
                    .option("donation", {
                        type: "array",
                        describe: "Donation options (start, end, min)",
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
                        choices: RaffleCommandOptionTarget.options,
                        describe: "Draw target"
                    }),
            handler: (argv: RaffleCommandOptionsType): void => {
                this.logger.log(`argv: ${JSON.stringify(argv)}`);
            }
        };
    }

    async execute(broadcasterId: string, options: RaffleCommandOptionsType): Promise<string> {
        this.logger.log(options);

        const optionOperation = options.operation;
        this.logger.log(optionOperation);

        const apiClient: ApiClient = await this.twitchService.getApiClient();
        const broadcaster: HelixUser = await apiClient.users.getUserById(broadcasterId) ?? ((): HelixUser => {
            throw new Error(`Twitch Account broadcasterId '${broadcasterId}' not found.`);
        })();

        switch (optionOperation) {
            case RaffleCommandArgumentOperation.enum.draw: {
                const optionDonation = options.donation;
                this.logger.log(optionDonation);

                const optionTwitch = options.twitch;
                this.logger.log(optionTwitch);

                const optionUnique = options.unique;
                this.logger.log(optionUnique);

                const optionTarget = options.target;
                this.logger.log(optionTarget);

                return await this.draw(broadcaster, optionDonation, optionTwitch, optionUnique, optionTarget);
            }
            default: {
                throw new Error();
            }
        }
    }

    async draw(broadcaster: HelixUser, donation: RaffleCommandOptionDonationType | undefined, twitch: RaffleCommandOptionTwitchType | undefined, unique: boolean, target: RaffleCommandOptionTargetType): Promise<string> {
        let users: RaffleUser[] = [];

        if (donation) {
            const start: number = getTime(parseISO(donation.start));
            this.logger.log(start);

            const end: number = getTime(parseISO(donation.end));
            this.logger.log(end);

            const min: number = donation.min;
            this.logger.log(min);
            const user: UserView = await this.twitchRepository.getUserByAccountId(broadcaster.id);
            if (user.user?.streamelements_id) {
                const streamElementsId: number = user.user.streamelements_id;
                const streamElements: StreamElements = await this.streamElementRepository.getById(streamElementsId);
                const streamElementsAccountId: string = streamElements.account_id;
                const streamElementsUsernames: string[] = await this.streamElementsDonations(streamElementsAccountId, start, end, min);
                streamElementsUsernames.forEach((username: string): void => {
                    users.push({
                        username: username,
                        color: null
                    });
                });
            }
        }

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

    async twitch(broadcaster: HelixUser, users: RaffleUser[], twitchUser: RaffleCommandOptionTwitchUserType): Promise<RaffleUser[]> {
        const filteredUsers: RaffleUser[] = [];

        await this.twitchService.login(broadcaster.id);
        const apiClient: ApiClient = await this.twitchService.getApiClient();

        const validUsers: string[] = users
            .map((user: RaffleUser): string => user.username)
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

    async streamElementsDonations(accountId: string, start: number, end: number, min: number): Promise<string[]> {
        const request: TipListRequestParams = {
            after: start,
            before: end,
            sort: "createdAt",
            limit: 100
        };

        const httpClient: StreamElementsHttpClient = await this.streamElementsService.getHttpClient(accountId);

        const tips: TipListDoc[] = [];
        let hasNextPage: boolean = true;
        let currentOffset: number = 0;
        while (hasNextPage) {
            const paginatedRequest = {...request, offset: currentOffset};
            const response: AxiosResponse<TipListResponse> = await httpClient.getTips(accountId, paginatedRequest);

            response.data.docs.forEach((doc: TipListDoc): void => {
                tips.push(doc);
            });

            hasNextPage = response.data.hasNextPage;
            currentOffset += response.data.limit;
        }

        const usernames: string[] = [];
        for (const tip of tips) {
            const username: string = tip.donation.user.username;

            let amount: number = tip.donation.amount;
            const currency: string = tip.donation.currency;
            if (currency !== "CZK") {
                const currencyRate: number = await this.currencyService.currencyRate(currency);
                amount *= currencyRate;
            }

            if (amount >= min) {
                usernames.push(username);
            }
        }

        return usernames;
    }

}
