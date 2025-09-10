const { REST, Routes } = require("discord.js");
const fs = require("node:fs");

const commands = [];
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

// コマンドの読み込み
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// 複数の GUILD_ID を環境変数から読み込む
const guildIds = [
  process.env.GUILD_ID_1,
  process.env.GUILD_ID_2,
].filter(Boolean);

(async () => {
  try {
    for (const id of guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, id),
        { body: commands }
      );
      console.log(`✅ コマンド登録完了: ${id}`);
    }
  } catch (error) {
    console.error(error);
  }
})();
