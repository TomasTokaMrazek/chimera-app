import {Injectable, Logger, OnModuleInit} from "@nestjs/common";

import {Command, CommanderError} from "@commander-js/extra-typings";
import {ApiClient, HelixUser} from "@twurple/api";
import {BaseApiClient} from "@twurple/api/lib/client/BaseApiClient";

import {RaffleService} from "@chimera/application/command/model/raffle";
import {RewardCommandOptions, RewardCommandOptionsType, RewardService} from "@chimera/application/command/model/reward";
import {TwitchService} from "@chimera/twitch/service";

import configuration from "@chimera/configuration";
import yargs, {ArgumentsCamelCase, Argv} from "yargs";
import {ZodError} from "zod/v4";
import {$ZodIssue} from "zod/dist/types/v4/core";

const chatbotAccountId: string = configuration.app.chatbot.twitch.accountId;

@Injectable()
export class CommandService implements OnModuleInit {

    private readonly logger: Logger = new Logger(CommandService.name);

    private readonly parser: Argv = yargs();
    private readonly program: Command = new Command();

    constructor(
        private readonly raffleService: RaffleService,
        private readonly rewardService: RewardService,
        private readonly twitchService: TwitchService
    ) {}

    async onModuleInit(): Promise<void> {
        this.program.addCommand(await this.raffleService.getCommand());
        this.program.exitOverride((error: CommanderError) => {
            throw error;
        });
        this.program.configureOutput({
            writeOut: (str: string): void => this.logger.log(`[OUT] ${str}`),
            writeErr: (str: string): void => this.logger.error(`[ERR] ${str}`)
        });

        this.parser
            .exitProcess(false)
            .command(this.rewardService.getCommand());
    }

    isCommand(message: string): boolean {
        return message.startsWith("$");
    }

    async executeCommand(message: string, broadcasterId: string, chatterId: string): Promise<void> {
        const twitchApiClient: ApiClient = await this.twitchService.getApiClient();
        const broadcaster: HelixUser = await twitchApiClient.users.getUserByIdBatched(broadcasterId) ?? ((): never => {
            throw new Error(`Twitch Account ID '${broadcasterId}' not found.`);
        })();
        const chatter: HelixUser = await twitchApiClient.users.getUserByIdBatched(chatterId) ?? ((): never => {
            throw new Error(`Twitch Account ID '${chatterId}' not found.`);
        })();
        try {
            const args: ArgumentsCamelCase = await this.parser.parseAsync(message.replace(/^\$\s*/, ""));
            this.logger.log(`argv: ${JSON.stringify(args)}`);
            switch (args._[0]) {
                case "reward": {
                    const commandOptions: RewardCommandOptionsType = RewardCommandOptions.parse(args);
                    const message: string = await this.rewardService.execute(broadcasterId, commandOptions);
                    const reply = `@${chatter.displayName} ${message}`;
                    await twitchApiClient.asUser(chatbotAccountId, async (ctx: BaseApiClient): Promise<void> => {
                        await ctx.chat.sendChatMessage(broadcaster, reply);
                    });
                    break;
                }
            }
        } catch (error: any) {
            this.logger.error(error);
            if (error instanceof CommanderError && error.code === "commander.unknownCommand") {
                return;
            } else if (error instanceof CommanderError || error.name === "YError") {
                const apiClient: ApiClient = await this.twitchService.getApiClient();
                await apiClient.asUser(chatbotAccountId, async (ctx: BaseApiClient): Promise<void> => {
                    await ctx.chat.sendChatMessage(broadcaster, `@${chatter.displayName} ${error.message}.`);
                });
            } else if (error instanceof ZodError) {
                const apiClient: ApiClient = await this.twitchService.getApiClient();
                await apiClient.asUser(chatbotAccountId, async (ctx: BaseApiClient): Promise<void> => {
                    const first: $ZodIssue = error.issues[0];
                    const fieldPath: string = first.path.map((segment: PropertyKey): string => String(segment)).join(".");
                    const message: string = first.message;
                    const reply = `@${chatter.displayName} ${message} for '${fieldPath}'.`;
                    await ctx.chat.sendChatMessage(broadcaster, reply);
                });
            } else {
                const apiClient: ApiClient = await this.twitchService.getApiClient();
                await apiClient.asUser(chatbotAccountId, async (ctx: BaseApiClient): Promise<void> => {
                    await ctx.chat.sendChatMessage(broadcaster, "@TokaTheFirst Máš tam chybu. SUBprise");
                });
            }
        }
    }

}
