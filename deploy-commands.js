const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('⏳ コマンド登録中...');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('✅ コマンド登録完了！');
  } catch (error) {
    console.error(error);
  }
})();
