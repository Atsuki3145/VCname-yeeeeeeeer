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
    const user = interaction.user;

    // VCに入っているか
    const voiceChannel = member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ VCに入ってから使ってください。' });
    }

    // ================== 所有者チェック ==================
    const vcName = voiceChannel.name || '';
    const userId = user.id;

    // 正規化（英数字のみ・小文字化）
    const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const vcNorm = normalize(vcName);
    const usernameNorm = normalize(user.username || '');
    const nicknameNorm = normalize(member.nickname || member.displayName || '');

    // IDは完全一致トークンで判定
    const idRegex = new RegExp(`(^|[^0-9])${userId}([^0-9]|$)`);
    const isOwner =
      idRegex.test(vcName) ||
      (usernameNorm && vcNorm.includes(usernameNorm)) ||
      (nicknameNorm && vcNorm.includes(nicknameNorm));

    console.log('vcrename: owner-check', {
      channelName: vcName,
      userTag: user.tag,
      userId,
      usernameNorm,
      nicknameNorm,
      isOwner
    });

    if (!isOwner) {
      return interaction.reply({
        content: '❌ あなたはこのVCの名前変更権を持っていません。'
      });
    }

    // ================== 実際の名前変更 ==================
    try {
      await voiceChannel.setName(newName);
      return interaction.reply({ content: `✅ VC名を **${newName}** に変更しました` });
    } catch (err) {
      console.error('setName error:', err);
      return interaction.reply({
        content: '⚠️ 名前変更に失敗しました。100文字までです。
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

// ================== 環境変数チェック ==================
if (!process.env.TOKEN) {
  console.error('❌ TOKEN が読み込まれていません！Render の Environment 設定を確認してください。');
  process.exit(1);
}
if (!process.env.CLIENT_ID) {
  console.error('❌ CLIENT_ID が読み込まれていません！Render の Environment 設定を確認してください。');
  process.exit(1);
}
console.log('✅ 環境変数チェック完了: TOKEN / CLIENT_ID 読み込み成功');

// ================== Discord ログイン ==================
client.login(process.env.TOKEN);
