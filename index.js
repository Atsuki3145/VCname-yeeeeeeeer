// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');

// ================== Discord Bot ==================
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// Bot起動時
client.once('ready', () => {
  console.log(`${client.user.tag} でログインしました`);
});

// /vcrename コマンド処理
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'vcrename') {
    const newName = interaction.options.getString('name', true);
    const member = interaction.member;

    // VCに入っているか
    const voiceChannel = member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ VCに入ってから使ってください。', ephemeral: true });
    }

    // 実際の名前変更
    try {
      await voiceChannel.setName(newName);
      return interaction.reply({ content: `✅ VC名を **${newName}** に変更しました` });
    } catch (err) {
      console.error('setName error:', err);
      return interaction.reply({
        content: '⚠️ 名前変更に失敗しました。Bot に「チャンネルを管理する」権限があるか確認してください。',
        ephemeral: true
      });
    }
  }
});

// ================== スラッシュコマンド登録 ==================
(async () => {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    const commands = [
      new SlashCommandBuilder()
        .setName('vcrename')
        .setDescription('今いるVCの名前を変更します')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('新しいVC名')
            .setRequired(true)
        )
    ].map(command => command.toJSON());

    console.log('⏳ スラッシュコマンドを登録中...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ スラッシュコマンド登録完了！');
  } catch (err) {
    console.error('コマンド登録エラー:', err);
  }
})();

// ================== Keepalive & 可視化 ==================
const app = express();
let pingCount = 0;
let lastPing = null;

app.get('/', (req, res) => {
  pingCount++;
  lastPing = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  console.log(`✅ Keepalive Ping 受信: ${lastPing}`);
  res.send(`Bot is alive! ✅ Ping Count: ${pingCount} (Last: ${lastPing})`);
});

app.get('/status', (req, res) => {
  res.json({
    status: "alive",
    pingCount,
    lastPing
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Web server running on port ${PORT}`));

// ================== Discord ログイン ==================
client.login(process.env.TOKEN);
