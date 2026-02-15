require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// 👑 みそらだよID
const OWNER_ID = '1350484083947475098';

// =====================
// スラッシュコマンド定義（解除のみ）
// =====================
const commands = [
  new SlashCommandBuilder()
    .setName('アンタイムアウト')
    .setDescription('指定ユーザーのタイムアウトを解除する（みそらだよ専用）')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('解除するユーザー')
        .setRequired(true)
    )
    .toJSON(),
];

// =====================
// コマンド登録
// =====================
client.once('ready', async () => {
  console.log(`ログイン完了: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('スラッシュコマンド登録完了');
  } catch (err) {
    console.error('コマンド登録失敗', err);
  }
});

// =====================
// コマンド処理
// =====================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // 🔒 みそらだよ専用
  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({
      content: '使用禁止',
      ephemeral: true,
    });
  }

  if (interaction.commandName === '使用禁止') {
    const target = interaction.options.getUser('user');

    try {
      const member = await interaction.guild.members.fetch(target.id);

      // null を渡すと解除
      await member.timeout(null, '禁止');

      await interaction.reply({
        content: `はい。`,
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '無理',
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.BOT_TOKEN);
