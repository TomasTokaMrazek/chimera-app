import {getTime, parseISO, subHours} from "date-fns";
import {TipListDoc, TipListRequestParams, TipListResponse} from "@chimera/streamelements/client/http/dto";
import {StreamElementsHttpClient} from "@chimera/streamelements/client/http/client";
import {AxiosResponse} from "axios";
import {ApiClient, HelixUser} from "@twurple/api";
import {chunkArray} from "@chimera/utils/array";
import {Injectable, Logger} from "@nestjs/common";
import {Command, OptionValues} from "@commander-js/extra-typings";
import {TwitchService} from "@chimera/twitch/service";
import {CurrencyService} from "@chimera/application/utils/currency/service";
import {StreamElementsService} from "@chimera/streamelements/service";
import {WheelService} from "@chimera/application/utils/wheel/service";
import {StreamElementsRepository} from "@chimera/streamelements/repository/repository";
import {TwitchRepository} from "@chimera/twitch/repository/repository";
import {UserView} from "@chimera/twitch/repository/views";
import {StreamElements} from "@chimera/prisma/client";
import {CommanderError} from "commander";
import {z} from "zod/v4";

export const RaffleCommandOptions = z.object({
    donation: z.array(z.string()).optional(),
    twitch: z.array(z.string()).optional(),
    unique: z.boolean().optional()
});
export type RaffleCommandOptionsType = z.infer<typeof RaffleCommandOptions>;

export const RaffleCommandOptionDonation = z.object({
    start: z.iso.datetime({offset: true, local: true}).optional(),
    end: z.iso.datetime({offset: true, local: true}).optional(),
    min: z.coerce.number().nonnegative().optional()
});
export type RaffleCommandOptionDonationType = z.infer<typeof RaffleCommandOptionDonation>;

export const RaffleCommandOptionTwitchUser = z.enum([
    "any",
    "exists",
    "follower",
    "subscriber"
]);
export type RaffleCommandOptionTwitchUserType = z.infer<typeof RaffleCommandOptionTwitchUser>;

export const RaffleCommandOptionTwitch = z.object({
    user: RaffleCommandOptionTwitchUser.optional()
});
export type RaffleCommandOptionTwitchType = z.infer<typeof RaffleCommandOptionTwitch>;

export interface RaffleUser {
    username: string;
    color: string | null;
}

export interface CommandModule {

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

    async getCommand(): Promise<Command<any, any>> {
        return new Command("$raffle")
            .argument("[target]", "target (wheel, pastebin)")
            .option("--donation <options...>", "donation options (start, end, min)")
            .option("--twitch <options...>", "twitch options (user)")
            .option("--unique", "unique usernames")
            .option("--no-unique", "no unique usernames")
            .exitOverride((error: CommanderError) => {
                throw error;
            });
    }

    async parse(accountId: string, args: string[], commandOptions: OptionValues): Promise<string> {
        let users: RaffleUser[] = [];

        const options: RaffleCommandOptionsType = RaffleCommandOptions.parse(commandOptions);
        this.logger.log(options);

        const optionsDonation: Record<string, string> = {};
        options.donation?.forEach((option: string): void => {
            const [key, value] = option.split("=");
            if (key && value) {
                optionsDonation[key] = value;
            }
        });
        this.logger.log(optionsDonation);

        const donation: RaffleCommandOptionDonationType = RaffleCommandOptionDonation.parse(optionsDonation);
        this.logger.log(donation);

        const start: number = donation?.start ? getTime(parseISO(donation.start)) : getTime(subHours(new Date(), 16));
        this.logger.log(start);

        const end: number = donation?.end ? getTime(parseISO(donation.end)) : getTime(new Date());
        this.logger.log(end);

        const min: number = donation?.min ?? 0;
        this.logger.log(min);
        if (donation) {
            const user: UserView = await this.twitchRepository.getUserByAccountId(accountId);
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

        const unique: boolean = options.unique ?? true;
        this.logger.log(unique);
        if (unique) {
            users = users.filter((user: RaffleUser, index: number, self: RaffleUser[]): boolean =>
                self.findIndex((u: RaffleUser): any => u.username === user.username) === index
            );
        }

        const optionsTwitch: Record<string, string> = {};
        options.twitch?.forEach((option: string): void => {
            const [key, value] = option.split("=");
            if (key && value) {
                optionsTwitch[key] = value;
            }
        });
        this.logger.log(optionsTwitch);

        const twitch: RaffleCommandOptionTwitchType = RaffleCommandOptionTwitch.parse(optionsTwitch);
        this.logger.log(twitch);

        if (twitch) {
            const twitchUser: RaffleCommandOptionTwitchUserType = twitch.user ?? RaffleCommandOptionTwitchUser.enum.any;
            users = await this.twitch(accountId, users, twitchUser);
        }

        const target: string = args[0] ?? "wheel";
        this.logger.log("Target:", target);

        switch (target) {
            case "wheel": {
                const apiClient: ApiClient = await this.twitchService.getApiClient();
                const user: HelixUser = await apiClient.users.getUserById(accountId) ?? ((): HelixUser => {
                    throw new Error(`Twitch Account ID '${accountId}' not found.`);
                })();
                const displayName: string = user.displayName;
                const profilePictureUrl: string = user.profilePictureUrl;

                this.logger.log(`ProfilePictureUrl: ${profilePictureUrl}`);

                return await this.wheelService.generate(displayName, profilePictureUrl, users);
            }
            case "pastebin": {
                throw new Error();
            }
            default: {
                throw new Error();
            }
        }
    }

    async twitch(accountId: string, users: RaffleUser[], twitchUser: RaffleCommandOptionTwitchUserType): Promise<RaffleUser[]> {
        const filteredUsers: RaffleUser[] = [];

        if (twitchUser !== RaffleCommandOptionTwitchUser.enum.any) {
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

            for (const helixUser of helixUsers) {
                switch (twitchUser) {
                    case RaffleCommandOptionTwitchUser.enum.exists: {
                        filteredUsers.push({
                            username: helixUser.displayName,
                            color: helixUserColors.get(helixUser.id) ?? null
                        });
                        break;
                    }
                    case RaffleCommandOptionTwitchUser.enum.follower: {
                        const isFollower: boolean = await helixUser.follows(accountId);
                        if (isFollower) {
                            filteredUsers.push({
                                username: helixUser.displayName,
                                color: helixUserColors.get(helixUser.id) ?? null
                            });
                        }
                        break;
                    }
                    case RaffleCommandOptionTwitchUser.enum.subscriber: {
                        const isSubscriber: boolean = await helixUser.isSubscribedTo(accountId);
                        if (isSubscriber) {
                            filteredUsers.push({
                                username: helixUser.displayName,
                                color: helixUserColors.get(helixUser.id) ?? null
                            });
                        }
                        break;
                    }
                }
            }
        } else {
            filteredUsers.push(...users);
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
