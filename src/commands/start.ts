import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { commands } from ".";
import { prisma } from "../util";
import voteHandler from "../voteHandler";
// import modes and maps from ./modes.jsonc
import modes from "../../modes.json";

commands.push({
  data: new SlashCommandBuilder().setName("start").setDescription(
    "starts scrim with default mode rotation",
  ).setDMPermission(false).setDefaultMemberPermissions(
    PermissionFlagsBits.MuteMembers,
  ),

  async execute(interaction) {
    // set the current mode in the database
    // this will be used to determine the next mode in the rotation later
    // check that the guild is in the database
    if (!interaction.inCachedGuild()) throw new Error("guild");

    const where = { id: interaction.guildId };
    const data = await prisma.guild.upsert({
      where,
      create: where,
      update: {},
    });

    // set the current mode to the first mode in the rotation
    await prisma.guild.update({
      where,
      data: {
        currentMode: "control",
      },
    });

    // pick 3 random maps from the control mode
    const controlMaps = modes.control;

    console.log(controlMaps);
    return;
    const maps = [];

    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * controlMaps.length);
      maps.push(controlMaps[randomIndex]);
    }

    // create the vote embed
    const embed = new EmbedBuilder()
      .setTitle("Map Vote")
      .setDescription("Vote for the next map")
      .setColor(`${"#" + Math.floor(Math.random() * 16777215).toString(16)}`)
      .addFields(
        { name: maps[0], value: "0 votes", inline: true },
        { name: maps[1], value: "0 votes", inline: true },
        { name: maps[2], value: "0 votes", inline: true },
      );

    const map1 = new ButtonBuilder()
      .setCustomId("map1")
      .setLabel("Illios")
      .setStyle(ButtonStyle.Secondary);

    const map2 = new ButtonBuilder()
      .setCustomId("map2")
      .setLabel("Samoa")
      .setStyle(ButtonStyle.Secondary);

    const map3 = new ButtonBuilder()
      .setCustomId("map3")
      .setLabel("Lijiang Tower")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
      .addComponents(map1, map2, map3);

    // summon vote handler
    const vote = new voteHandler();

    const response = await interaction.reply({
      content: "Vote for the next map!",
      embeds: [embed],
      components: [row],
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 3_600_000,
    });

    collector.on("collect", async (i) => {
      const selection = i.customId;

      // cast the user's vote
      vote.voteForMap(selection, i.user.id);

      // update the vote count in the embed
      const map1Votes = vote.votes.map1.length;
      const map2Votes = vote.votes.map2.length;
      const map3Votes = vote.votes.map3.length;

      embed.spliceFields(0, 3, {
        name: maps[0],
        value: `${map1Votes} votes`,
        inline: true,
      }, {
        name: maps[1],
        value: `${map2Votes} votes`,
        inline: true,
      }, {
        name: maps[2],
        value: `${map3Votes} votes`,
        inline: true,
      });

      await i.update({
        content: "Vote for the next map!",
        embeds: [embed],
        components: [row],
      });
    });
  },
});
