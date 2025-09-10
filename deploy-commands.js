const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
  new SlashCommandBuilder().setName("hello").setDescription("Say hello!"),
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

const guildIds = [process.env.GUILD_ID_1, process.env.GUILD_ID_2].filter(Boolean);

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
