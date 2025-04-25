const fs = require('fs');
const path = require('path');
const {
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const customId = interaction.customId;
    const userId = interaction.user.id;

    // 🛠️ Helper functions
    const readJSON = (filePath) => {
      if (!fs.existsSync(filePath)) return Array.isArray(filePath) ? [] : {};
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    };

    const writeJSON = (filePath, data) => {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    };

    const usersPath = path.join(__dirname, '../data/users.json');
    const users = readJSON(usersPath);
    if (!users[userId]) users[userId] = { coins: 0 };  // تأمين وجود بيانات المستخدم

    // ✅ فتح المتجر
    if (customId === 'open_shop_intro') {
      const shopItems = readJSON(path.join(__dirname, '../data/shop_items.json'));

      if (!Array.isArray(shopItems) || shopItems.length === 0) {
        return interaction.reply({ content: '❌ لا يوجد عناصر في المتجر حالياً.', ephemeral: true });
      }

      const options = shopItems.map((item, index) => ({
        label: item.name.slice(0, 50),
        description: `السعر: ${item.price.toLocaleString()} 💰`,
        value: `shop_${index}`
      }));

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('shop_selector')
          .setPlaceholder('🛍️ اختر العنصر الذي ترغب بشرائه')
          .addOptions(options.slice(0, 25))
      );

      return interaction.reply({
        content: `🎁 اختر العنصر الذي ترغب بشرائه من متجر NEXO2 BANK:`,
        components: [row],
        ephemeral: true
      });
    }

    // 🛍️ عند اختيار عنصر من المتجر
    if (interaction.isStringSelectMenu() && customId === 'shop_selector') {
      const index = parseInt(interaction.values[0].split('_')[1]);
      const shopItems = readJSON(path.join(__dirname, '../data/shop_items.json'));
      const item = shopItems[index];

      if (!item) {
        return interaction.reply({ content: '❌ هذا العنصر غير موجود.', ephemeral: true });
      }

      const user = users[userId];
      if (user.coins < item.price) {
        return interaction.reply({
          content: `❌ لا تملك كوينز كافية. السعر: ${item.price} 💰 | رصيدك: ${user.coins} 💰`,
          ephemeral: true
        });
      }

      user.coins -= item.price;

      if (item.type === 'role') {
        const member = await interaction.guild.members.fetch(userId);
        await member.roles.add(item.roleId);
        writeJSON(usersPath, users);
        return interaction.reply({ content: `✅ تم منحك الرول: ${item.name}`, ephemeral: true });
      } else if (item.type === 'feature') {
        writeJSON(usersPath, users);
        return interaction.reply({ content: `🎉 تم شراء الميزة: ${item.name}. سيتم تفعيلها قريبًا!`, ephemeral: true });
      }
    }

    // 🎰 الروليت
    if (customId.startsWith('start_roulette_')) {
      const initiatorId = customId.split('_')[2];
      if (userId !== initiatorId) {
        return interaction.reply({ content: '❌ هذا الزر ليس مخصص لك.', ephemeral: true });
      }

      const items = readJSON(path.join(__dirname, '../data/roulette_items.json'));
      const user = users[userId];
      const cost = 150;

      if (user.coins < cost) {
        return interaction.reply({ content: `❌ تحتاج ${cost} 🪙 للدوران. رصيدك: ${user.coins} 🪙`, ephemeral: true });
      }

      const now = Date.now();
      const cooldown = 10 * 60 * 1000;
      const isAdmin = interaction.member.permissions.has('Administrator');

      if (!isAdmin && now - (user.lastSpin || 0) < cooldown) {
        const remaining = Math.ceil((cooldown - (now - user.lastSpin)) / 60000);
        return interaction.reply({ content: `⏳ انتظر ${remaining} دقيقة قبل المحاولة مرة أخرى.`, ephemeral: true });
      }

      user.coins -= cost;
      user.lastSpin = now;

      const chosen = items[Math.floor(Math.random() * items.length)];
      const { drawRouletteWheel } = require('../utils/rouletteDraw');
      const winnerIndex = items.findIndex(item => item.label === chosen.label);
      const imageBuffer = await drawRouletteWheel(items, winnerIndex);

      await interaction.channel.send({ files: [{ attachment: imageBuffer, name: 'roulette-result.png' }] });

      let resultMessage = '';
      switch (chosen.effect) {
        case 'coins':
          user.coins += chosen.value;
          resultMessage = `🎁 +${chosen.value} كوينز لـ <@${userId}>`;
          break;
        case 'halve':
          const lost = Math.floor(user.coins / 2);
          user.coins -= lost;
          resultMessage = `💸 تم خصم ${lost} كوينز من <@${userId}>`;
          break;
        case 'cooldown':
          user.lastSpin = now + (chosen.duration || 60) * 60 * 1000;
          break;
        case 'role':
          const member = await interaction.guild.members.fetch(userId);
          await member.roles.add(chosen.roleId);
          setTimeout(() => member.roles.remove(chosen.roleId), (chosen.duration || 2) * 60 * 60 * 1000);
          break;
        case 'percent':
          const loss = Math.floor(user.coins * (chosen.value / 100));
          user.coins -= loss;
          resultMessage = `📉 خصم ${loss} كوينز (${chosen.value}%) من <@${userId}>`;
          break;
        case 'blockMission':
          const blockPath = path.join(__dirname, '../data/blockedMissions.json');
          const blocked = readJSON(blockPath);
          blocked[userId] = Date.now() + (chosen.duration || 60) * 60 * 1000;
          writeJSON(blockPath, blocked);
          resultMessage = `🚫 تم منع <@${userId}> من استخدام المهام مؤقتًا.`;
          break;
      }

      writeJSON(usersPath, users);

      await interaction.reply({ content: `🎰 النتيجة: **${chosen.label}**!`, ephemeral: false });
      if (resultMessage) await interaction.channel.send(resultMessage);
    }

    // 📈 الاستثمار
    if (customId.startsWith('invest_')) {
      const stockName = customId.replace('invest_', '');
      const stocks = readJSON(path.join(__dirname, '../data/stocks.json'));
      const stock = stocks.find(s => s.name === stockName);

      if (!stock) {
        return interaction.reply({ content: '❌ الشركة غير موجودة.', ephemeral: true });
      }

      await interaction.reply({
        content: `💰 كم تريد أن تستثمر في سهم **${stock.name}**؟\n📈 النسبة الحالية: ${(stock.rate * 100).toFixed(1)}%\n✍️ اكتب المبلغ الذي تريد استثماره (مثال: \`500\`)`,
        ephemeral: true
      });

      const filter = m => m.author.id === userId;
      const collector = interaction.channel.createMessageCollector({ filter, time: 5000, max: 1 });

      collector.on('collect', msg => {
        const amount = parseInt(msg.content);

        if (isNaN(amount) || amount <= 0) {
          return msg.reply('❌ يجب إدخال مبلغ صحيح.');
        }

        if (users[userId].coins < amount) {
          return msg.reply(`❌ رصيدك غير كافي. رصيدك: ${users[userId].coins} 🪙`);
        }

        const profit = Math.floor(amount * stock.rate);
        users[userId].coins = users[userId].coins - amount + amount + profit;

        writeJSON(usersPath, users);

        msg.reply(`✅ استثمرت ${amount} 🪙 في **${stock.name}**.\n📈 ربحت: ${profit} 🪙\n💼 رصيدك الآن: ${users[userId].coins} 🪙`);
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.followUp({ content: '⌛ انتهى الوقت ولم يتم إدخال مبلغ.', ephemeral: true });
        }
      });
    }
  }
};
