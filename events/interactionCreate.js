// ... بداية الكود كما هو بدون تغيير ...
const fs = require('fs');
const path = require('path');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const customId = interaction.customId;
    const userId = interaction.user.id;

    // ✅ فتح المتجر
    // (يبقى كما هو)

    // 🛍️ عند اختيار عنصر من المتجر
    // (يبقى كما هو)

    // 🎰 الروليت
    // (يبقى كما هو)

    // 📈 الاستثمار - بعد التعديل
    if (customId.startsWith('invest_')) {
      const stockName = customId.replace('invest_', '');
      const usersPath = path.join(__dirname, '../data/users.json');
      const stocksPath = path.join(__dirname, '../data/stocks.json');

      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const stocks = JSON.parse(fs.readFileSync(stocksPath, 'utf8'));

      const user = users[userId] || { coins: 0 };
      const stock = stocks.find(s => s.name === stockName);

      if (!stock) return interaction.reply({ content: '❌ الشركة غير موجودة.', ephemeral: true });

      await interaction.reply({
        content: `💰 كم تريد أن تستثمر في سهم **${stock.name}**؟\n📈 النسبة الحالية: ${(stock.rate * 100).toFixed(1)}%\n✍️ اكتب المبلغ الذي تريد استثماره (مثال: \`500\`)`,
        ephemeral: true
      });

      const filter = m => m.author.id === userId;
      const collector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });

      collector.on('collect', msg => {
        const amount = parseInt(msg.content);
        if (isNaN(amount) || amount <= 0) {
          return msg.reply('❌ يجب إدخال مبلغ صحيح.');
        }

        if (user.coins < amount) {
          return msg.reply(`❌ لا تملك رصيد كافي. رصيدك الحالي: ${user.coins} 🪙`);
        }

        const profit = Math.floor(amount * stock.rate);
        user.coins = user.coins - amount + amount + profit;  // استرجاع المبلغ مع الربح

        users[userId] = user;
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

        msg.reply(`✅ استثمرت ${amount} 🪙 في **${stock.name}**.\n📈 ربحت: ${profit} 🪙\n💼 رصيدك الآن: ${user.coins} 🪙`);
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.followUp({ content: '⌛ انتهى الوقت ولم يتم إدخال مبلغ.', ephemeral: true });
        }
      });
    }
  }
};
