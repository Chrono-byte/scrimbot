import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { commands } from ".";

commands.push({
  data: new SlashCommandBuilder().setName("next").setDescription(
    "Move to the next mode in the rotation",
  ),

  async execute(interaction) {},
});
