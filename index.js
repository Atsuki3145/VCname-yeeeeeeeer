// index.js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

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
    const user = interaction.user;

    // VCに入っているか
    const voiceChannel = member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ VCに入ってから使ってください。', ephemeral: true });
    }

    // 所有者判定（ユーザー名 / ニックネーム / ユーザーID のいずれかを含むか）
    const vcNameLower = voiceChannel.name.toLowerCase();
    const usernameLower = user.username.toLowerCase();
    const nicknameLower = (member.nickname || '').toLowerCase();
    const userId = user.id;

    const isOwner =
      vcNameLower.includes(usernameLower) ||
      (nicknameLower && vcNameLower.includes(nicknameLower)) ||
      voiceChannel.name.includes(userId);

    if (!isOwner) {
      return interaction.reply({
        content: '❌ あなたはこのVCの名前変更権を持っていないため、拒否されました。',
        ephemeral: true
      });
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

// ===== ダミーWebサーバー（Render / GitHub Actions の Keepalive 用） =====
const app = express();
app.get('/', (req, res) => {
  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  console.log(`✅ Keepalive Ping 受信: ${now}`);
  res.send("Bot is alive!");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Web server running on port ${PORT}`));

// Discord ログイン
client.login(process.env.TOKEN);
