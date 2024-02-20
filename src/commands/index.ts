import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

interface Command {
  data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute(interaction: ChatInputCommandInteraction): Promise<unknown>;
}

export const commands: Command[] = [];

await Promise.all([
  import("./start"),
  import("./next"),
  import("./gamerule"),
  import("./ping"),
]);
