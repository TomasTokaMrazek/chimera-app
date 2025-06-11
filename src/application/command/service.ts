import {Injectable, Logger, OnModuleInit} from "@nestjs/common";

import {ZodError} from "zod";
import {Command, CommanderError, OptionValues} from "@commander-js/extra-typings";
import {ApiClient, HelixUser} from "@twurple/api";
import {BaseApiClient} from "@twurple/api/lib/client/BaseApiClient";

import {RaffleService} from "@chimera/application/command/model/raffle";
import {TwitchService} from "@chimera/twitch/service";

import configuration from "@chimera/configuration";

const chatbotAccountId: string = configuration.app.chatbot.twitch.accountId;

@Injectable()
export class CommandService implements OnModuleInit {

    private readonly logger: Logger = new Logger(CommandService.name);

    private readonly program: Command = new Command();

    constructor(
        private readonly raffleService: RaffleService,
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
    }

    isCommand(message: string): boolean {
        return message.startsWith("$");
    }

    async executeCommand(message: string, broadcasterId: string, chatterId: string): Promise<void> {
        const twitchApiClient: ApiClient = await this.twitchService.getApiClient();
        const broadcaster: HelixUser = await twitchApiClient.users.getUserByIdBatched(broadcasterId) ?? (() => {
            throw new Error(`Twitch Account ID '${broadcasterId}' not found.`);
        })();
        const chatter: HelixUser = await twitchApiClient.users.getUserByIdBatched(chatterId) ?? (() => {
            throw new Error(`Twitch Account ID '${chatterId}' not found.`);
        })();
        try {
            const commandArguments: string[] = message.trim().split(/\s+/);
            this.program.parse(commandArguments, {from: "user"});
            const command = this.program.commands.at(0);
            if (command) {
                const args: string[] = command.args;
                const options: OptionValues = command.opts();
                const url: string = await this.raffleService.parse("27122439", args, options);
                const apiClient: ApiClient = await this.twitchService.getApiClient();
                await apiClient.asUser(chatbotAccountId, async (ctx: BaseApiClient): Promise<void> => {
                    await ctx.chat.sendChatMessage(broadcaster, url);
                });
            }
        } catch (error: any) {
            this.logger.error(error);
            if (error instanceof CommanderError && error.code === "commander.unknownCommand") {
                return;
            } else if (error instanceof ZodError) {
                const apiClient: ApiClient = await this.twitchService.getApiClient();
                await apiClient.asUser(chatbotAccountId, async (ctx: BaseApiClient): Promise<void> => {
                    await ctx.chat.sendChatMessage(broadcaster, `@${chatter.displayName} ${error.errors[0].message} for '${error.errors[0].path[0]}'.`);
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
