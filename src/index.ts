import { Client, Events, GatewayIntentBits } from "discord.js";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

client.once(Events.ClientReady, (client) => {
  console.log(
    `Ready! Logged in as ${client.user.tag} ${client.user.id} for ${client.guilds.cache.size} guilds`,
  );

  const inviteLink =
    `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot`;
  console.log(`Invite link: ${inviteLink}`);

  client.user.setActivity(process.env.CLIENT_ACTIVITY ?? "");
});

await import("./events");

if (import.meta.main) {
  await client.login(process.env.DISCORD_TOKEN);
}
