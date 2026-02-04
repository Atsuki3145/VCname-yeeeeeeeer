// ================== 初期設定 ==================
require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const express = require('express');

// ================== 設定 ==================
// VC名変更を無条件で許可するユーザーID
const FREE_RENAME_USER_IDS = ['1350484083947475098'];

// ================== Discord Bot ==================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ],
});

// Bot起動時
client.once('ready', () => {
  console.log(`${client.user.tag} でログインしました`);
});

// ================== interaction 処理 ==================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ================== /join ==================
  if (interaction.commandName === 'join') {
    const vc = interaction.member?.voice?.channel;
    if (!vc) {
      return interaction.reply({
        content: '❌ VCに入ってから使ってください。',
      });
    }

    joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator,
    });

    return interaction.reply({
      content: 'はい。',
    });
  }

  // ================== /leave ==================
  if (interaction.commandName === 'leave') {
    const connection = getVoiceConnection(interaction.guild.id);
    if (connection) connection.destroy();

    return interaction.reply({
      content: '😇',
    });
  }

  // ================== /vcrename ==================
  if (interaction.commandName !== 'vcrename') return;

  const newName = interaction.options.getString('name', true);
  const member = interaction.member;
  const user = interaction.user;

  const voiceChannel = member?.voice?.channel;
  if (!voiceChannel) {
    return interaction.reply({
      content: '❌ VCに入ってから使ってください。',
    });
  }

  // 特例ユーザー
  const isFreeUser = FREE_RENAME_USER_IDS.includes(user.id);

  // 所有者チェック
  let isOwner = false;

  if (!isFreeUser) {
    const vcName = voiceChannel.name || '';
    const userId = user.id;

    const normalize = (s) =>
      (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const vcNorm = normalize(vcName);
    const usernameNorm = normalize(user.username || '');
    const nicknameNorm = normalize(member.nickname || member.displayName || '');

    const idRegex = new RegExp(`(^|[^0-9])${userId}([^0-9]|$)`);

    isOwner =
      idRegex.test(vcName) ||
      (usernameNorm && vcNorm.includes(usernameNorm)) ||
      (nicknameNorm && vcNorm.includes(nicknameNorm));
  }

  if (!isFreeUser && !isOwner) {
    return interaction.reply({
      content: '❌ あなたはこのVCの名前変更権を持っていません。',
    });
  }

  try {
    await voiceChannel.setName(newName);
    return interaction.reply({
      content: `✅ VC名を **${newName}** に変更しました`,
    });
  } catch (err) {
    console.error('setName error:', err);
    return interaction.reply({
      content: '⚠️ 名前変更に失敗しました（100文字以内か確認してください）',
      ephemeral: true,
    });
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
          option
            .setName('name')
            .setDescription('新しいVC名')
            .setRequired(true)
        ),

      new SlashCommandBuilder()
        .setName('join')
        .setDescription('VCに入るだけ'),

      new SlashCommandBuilder()
        .setName('leave')
        .setDescription('VCから出るだけ'),
    ].map(cmd => cmd.toJSON());

    console.log('⏳ スラッシュコマンド登録中...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ スラッシュコマンド登録完了！');
  } catch (err) {
    console.error('❌ コマンド登録エラー:', err);
  }
})();

// ================== Keepalive 用 Web ==================
const app = express();
let pingCount = 0;
let lastPing = null;

app.get('/', (req, res) => {
  pingCount++;
  lastPing = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  console.log(`✅ Keepalive Ping: ${lastPing}`);
  res.send(`Bot is alive! ✅ Ping: ${pingCount}`);
});

app.get('/status', (req, res) => {
  res.json({
    status: 'alive',
    pingCount,
    lastPing
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
});

// ================== 環境変数チェック ==================
if (!process.env.TOKEN) {
  console.error('❌ TOKEN が設定されていません');
  process.exit(1);
}
if (!process.env.CLIENT_ID) {
  console.error('❌ CLIENT_ID が設定されていません');
  process.exit(1);
}
console.log('✅ 環境変数チェックOK');

// ================== Discord ログイン ==================
client.login(process.env.TOKEN);
