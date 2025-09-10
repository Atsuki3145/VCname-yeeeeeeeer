// index.js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once('ready', () => {
  console.log(`${client.user.tag} でログインしました`);
});

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

    // 所有者判定（実用的な複数パターンで判定）
    // - VC名にユーザー名が含まれている（小文字比較）
    // - VC名にニックネーム（サーバー内の表示名）が含まれている
    // - VC名にユーザーIDが含まれている（もしIDで付けているなら）
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
        content: '❌ あなたはここvcの名前変更権を持っていないため、拒否されました。',
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

// ===== ダミーWebサーバー（Koyebのヘルスチェック通過用） =====
const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Web server running on port ${PORT}`));

// ログイン
client.login(process.env.TOKEN);
