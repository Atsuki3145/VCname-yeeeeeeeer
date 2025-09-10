require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once("ready", () => {
  console.log(`${client.user.tag} でログインしました`);
});

client.login(process.env.TOKEN);
// ====== Web サーバー部分 ======
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

// Koyeb が PORT 環境変数を設定するのでそれを使う
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("🏓 Pong!");
  }
});
