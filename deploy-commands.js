// deploy-commands.js
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('vcrename')
    .setDescription('参加しているVCの名前を変更します')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('新しいVC名')
        .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('コマンド登録中...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log('コマンド登録完了 ✅');
  } catch (error) {
    console.error(error);
  }
})();
