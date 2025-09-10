const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ====== Slash Command 登録 ======
const commands = [
  new SlashCommandBuilder()
    .setName('vcrename')
    .setDescription('自分がいるVCの名前を変更します')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('新しいVCの名前')
        .setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
  console.log(`${client.user.tag} でログインしました`);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ スラッシュコマンド登録完了');
  } catch (err) {
    console.error(err);
  }
});

// ====== コマンド処理 ======
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'vcrename') {
    const newName = interaction.options.getString('name');
    const member = interaction.member;

    // ユーザーがVCに参加しているか確認
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ VCに入ってから使ってください', ephemeral: true });
    }

    // VCの作成者と実行者を比較
    // ここでは「そのVCの名前にユーザー名が含まれている場合のみ許可」
    if (!voiceChannel.name.includes(member.user.username)) {
      return interaction.reply({ content: '❌ このVCの名前を変更する権限がありません', ephemeral: true });
    }

    try {
      await voiceChannel.setName(newName);
      interaction.reply({ content: `✅ VC名を **${newName}** に変更しました！` });
    } catch (err) {
      console.error(err);
      interaction.reply({ content: '⚠️ 名前変更に失敗しました', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
