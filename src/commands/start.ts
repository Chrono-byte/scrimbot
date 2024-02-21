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
import { intToModeName, modeNameToInt, modes, prisma } from "../util";
import voteHandler from "../voteHandler";

commands.push({
  data: new SlashCommandBuilder().setName("start").setDescription(
    "start first map vote",
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
      // as we are setting up the s
      update: { currentMode: "control" },
    });

    // set the current mode to the first mode in the rotation
    const guildData = await prisma.guild.findFirst({
      where: { id: interaction.guildId },
    }) as { currentMode: string };

    const currentMode = guildData.currentMode as any as keyof typeof modes;
    const controlMaps = modes[currentMode];

    // get the map rotation for the current mode
    let maps: string[] = [];
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(
        Math.random() * Object.keys(controlMaps).length,
      );

      // check if the map is already in the array
      if (maps.includes(Object.values(controlMaps)[randomIndex])) {
        i--;
        continue;
      }

      maps.push(Object.values(controlMaps)[randomIndex]);
    }

    // get the current mode's vote duration
    const voteDuration = data?.voteDuration as number;

    // create the vote embed
    const embed = new EmbedBuilder()
      .setTitle("Map Vote")
      .setDescription("Vote for the next map")
      .setColor("Fuchsia")
      .addFields(
        { name: maps[0], value: "0 votes", inline: true },
        { name: maps[1], value: "0 votes", inline: true },
        { name: maps[2], value: "0 votes", inline: true },
      )
      .setFooter({
        text: `Countdown: ${voteDuration / 1000} seconds`,
      });

    const startTimestamp = new Date().getTime();

    const map1 = new ButtonBuilder()
      .setCustomId("map1")
      .setLabel(maps[0])
      .setStyle(ButtonStyle.Secondary);

    const map2 = new ButtonBuilder()
      .setCustomId("map2")
      .setLabel(maps[1])
      .setStyle(ButtonStyle.Secondary);

    const map3 = new ButtonBuilder()
      .setCustomId("map3")
      .setLabel(maps[2])
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
      .addComponents(map1, map2, map3);

    // summon vote handler
    const vote = new voteHandler();

    const response = await interaction.reply({
      content: "",
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
        content: "",
        embeds: [embed],
        components: [row],
      });
    });

    // loop every second to check if the vote has ended, update the footer, then at 45 seconds, end the vote, and destroy the collector
    const interval = setInterval(async () => {
      let timeLeft = startTimestamp + voteDuration - new Date().getTime();
      timeLeft = Math.floor(timeLeft / 1000);
      // only show two whole numbers, no decimals
      embed.setFooter({
        text: `Countdown: ${timeLeft} seconds`,
      });

      await response.edit({
        content: "",
        embeds: [embed],
        components: [row],
      });

      if (timeLeft <= 2) {
        embed.setFooter({
          text: "Vote has ended",
        });

        // sum the votes for each map
        const map1Votes = vote.votes.map1.length;
        const map2Votes = vote.votes.map2.length;
        const map3Votes = vote.votes.map3.length;

        // get the map with the most votes
        let winningMap = "";

        if (map1Votes > map2Votes && map1Votes > map3Votes) {
          winningMap = maps[0];
        } else if (map2Votes > map1Votes && map2Votes > map3Votes) {
          winningMap = maps[1];
        } else if (map3Votes > map1Votes && map3Votes > map2Votes) {
          winningMap = maps[2];
        } else {
          // if there's a tie, pick a random map
          winningMap = maps[Math.floor(Math.random() * 3)];
        }

        // set the winning map in our embed
        embed.setTitle("Winning Map");
        embed.setDescription(`The winning map is ${winningMap}`);

        // calculate what percentage of the vote the each map got to display in the embed
        const totalVotes = map1Votes + map2Votes + map3Votes;
        const map1Percent = Math.round((map1Votes / totalVotes) * 100);
        const map2Percent = Math.round((map2Votes / totalVotes) * 100);
        const map3Percent = Math.round((map3Votes / totalVotes) * 100);

        // update the embed to show the percentage of the vote each map got
        embed.spliceFields(0, 3, {
          name: maps[0],
          value: `${map1Votes} votes - ${map1Percent}%`,
          inline: true,
        }, {
          name: maps[1],
          value: `${map2Votes} votes - ${map2Percent}%`,
          inline: true,
        }, {
          name: maps[2],
          value: `${map3Votes} votes - ${map3Percent}%`,
          inline: true,
        });

        // update the embed with the winning map
        await response.edit({
          content: "",
          embeds: [embed],
          components: [],
        });

        clearInterval(interval);
        collector.stop();
      }
    }, 999);
  },
});
