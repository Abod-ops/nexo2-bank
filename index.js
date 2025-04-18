const { Client, GatewayIntentBits, Partials, Collection, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// تحميل الأوامر
const commandFiles = fs.readdirSync('./commands');
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// تحميل الأحداث
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// أوامر النص العادية
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const prefix = '#';
  if (!message.content.startsWith(prefix)) return;

  const allowedChannel = 'bank-game↯';
  if (message.channel.name !== allowedChannel) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply('❌ حدث خطأ أثناء تنفيذ الأمر.');
  }
});

// المهام التفاعلية (زر المهمة)
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const [action, , userId] = interaction.customId.split('-');
  if (action !== 'start' || interaction.user.id !== userId) return;

  const activeMissionsPath = path.join(__dirname, './data/activeMissions.json');
  const usersPath = path.join(__dirname, './data/users.json');
  const activeMissions = JSON.parse(fs.readFileSync(activeMissionsPath));
  const users = JSON.parse(fs.readFileSync(usersPath));
  const userMission = activeMissions[userId];

  if (!userMission) {
    return interaction.reply({ content: '❌ لا توجد مهمة نشطة لك.', ephemeral: true });
  }

  await interaction.reply({ content: `⌛ لديك 10 ثواني للإجابة على المهمة:`, ephemeral: true });

  const filter = m => m.author.id === userId;
  const collector = interaction.channel.createMessageCollector({ filter, time: 10000, max: 1 });

  collector.on('collect', msg => {
    const answer = msg.content.toLowerCase().trim();
    const acceptedAnswers = Array.isArray(userMission.answer)
      ? userMission.answer.map(a => a.toLowerCase())
      : [userMission.answer.toLowerCase()];

    if (acceptedAnswers.includes(answer)) {
      if (!users[userId]) users[userId] = { coins: 0 };
      users[userId].coins += userMission.reward;

      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      delete activeMissions[userId];
      fs.writeFileSync(activeMissionsPath, JSON.stringify(activeMissions, null, 2));

      return msg.reply(`🎉 تم إنجاز المهمة بنجاح!\n📦 الجائزة: +${userMission.reward} كوين`);
    } else {
      msg.reply(`❌ الإجابة غير صحيحة. سيتم إتاحة مهمة جديدة بعد 15 دقيقة.`);
      delete activeMissions[userId];
      fs.writeFileSync(activeMissionsPath, JSON.stringify(activeMissions, null, 2));
    }
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      interaction.channel.send(`⌛ انتهى الوقت! المهمة ألغيت. حاول مجددًا بعد 15 دقيقة.`);
      delete activeMissions[userId];
      fs.writeFileSync(activeMissionsPath, JSON.stringify(activeMissions, null, 2));
    }
  });
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

const shopChannel = client.channels.cache.find(ch => ch.name === 'points-shop↯');
if (shopChannel) sendShopIntro(shopChannel, client);
});

// 🛍️ إرسال واجهة المتجر
async function sendShopIntro(channel, client) {
  const imagePath = path.join(__dirname, './assets/shop-banner.png');
  const attachment = new AttachmentBuilder(imagePath);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`open_shop_intro`)
      .setLabel('🛍️ فتح المتجر')
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({
    content: '📦 **مرحبًا بك في متجر NEXO2 BANK**\nاضغط الزر بالأسفل لاستعراض المنتجات.',
    files: [attachment],
    components: [row]
  });
}

// تحديث الأسهم كل 10 دقائق
const updateStocks = require('./updateStocks');
setInterval(updateStocks, 10 * 60 * 1000);
updateStocks();

// إبقاء البوت شغال على رندر
const http = require('http');
http.createServer((req, res) => {
  res.write("NEXO2-BOT is alive");
  res.end();
}).listen(process.env.PORT || 3000);

client.login(process.env.TOKEN);
