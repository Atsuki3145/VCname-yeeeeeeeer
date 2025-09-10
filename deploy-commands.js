// deploy-commands.js
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('vcrename')
    .setDescription('自分が作った個人VCの名前を変更します')
    .addStringOption(opt =>
      opt.setName('name')
         .setDescription('変更後のVC名')
         .setRequired(true)
    )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 スラッシュコマンド登録中...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ スラッシュコマンド登録完了');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
