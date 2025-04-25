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

    // Helper functions
    const readJSON = (filePath) => {
      if (!fs.existsSync(filePath)) return {};
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    };

    const writeJSON = (filePath, data) => {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    };

    // ✅ فتح المتجر
    if (customId === 'open_shop_intro') {
      const shopPath = path.join(__dirname, '../data/shop_items.json');
      const shopItems = readJSON(shopPath);

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

      await interaction.reply({
        content: `🎁 اختر العنصر الذي ترغب بشرائه من متجر NEXO2 BANK:`,
        components: [row],
        ephemeral: true
      });
    }

    // 🛍️ عند اختيار عنصر من المتجر
    else if (interaction.isStringSelectMenu() && customId === 'shop_selector') {
      const index = parseInt(interaction.values[0].split('_')[1]);
      const shopItems = readJSON(path.join(__dirname, '../data/shop_items.json'));
      const users = readJSON(path.join(__dirname, '../data/users.json'));

      const item = shopItems[index];
      const user = users[userId] || { coins: 0 };

      if (!item) {
        return interaction.reply({ content: '❌ هذا العنصر غير موجود.', ephemeral: true });
      }

      if (user.coins < item.price) {
        return interaction.reply({
          content: `❌ لا تملك كوينز كافية. مطلوب: ${item.price} 💰، معك: ${user.coins} 💰`,
          ephemeral: true
        });
      }

      user.coins -= item.price;
      users[userId] = user;
      writeJSON(path.join(__dirname, '../data/users.json'), users);

      if (item.type === 'role') {
        const member = await interaction.guild.members.fetch(userId);
        await member.roles.add(item.roleId);
        return interaction.reply({ content: `✅ تم منحك الرول: ${item.name}`, ephemeral: true });
      } else if (item.type === 'feature') {
        return interaction.reply({ content: `🎉 تم شراء الميزة: ${item.name}. سيتم تفعيلها قريبًا!`, ephemeral: true });
      }
    }

    // 🎰 الروليت
    else if (customId.startsWith('start_roulette_')) {
      const initiatorId = customId.split('_')[2];
      if (userId !== initiatorId) return interaction.reply({ content: '❌ هذا الزر ليس مخصص لك.', ephemeral: true });

      const users = readJSON(path.join(__dirname, '../data/users.json'));
      const items = readJSON(path.join(__dirname, '../data/roulette_items.json'));

      const user = users[userId] || { coins: 0 };
      const cost = 150;

      if (user.coins < cost) {
        return interaction.reply({ content: `❌ لا تملك كوينز كافية. تحتاج ${cost - user.coins} 🪙`, ephemeral: true });
      }

      const now = Date.now();
      const lastSpin = user.lastSpin || 0;
      const cooldown = 10 * 60 * 1000;
      const isAdmin = interaction.member.permissions.has('Administrator');

      if (!isAdmin && now - lastSpin < cooldown) {
        const remaining = Math.ceil((cooldown - (now - lastSpin)) / 60000);
        return interaction.reply({ content: `⏳ انتظر ${remaining} دقيقة قبل التجربة مرة أخرى.`, ephemeral: true });
      }

      user.coins -= cost;
      user.lastSpin = now;

      const chosen = items[Math.floor(Math.random() * items.length)];
      const { drawRouletteWheel } = require('../utils/rouletteDraw');
      const winnerIndex = items.findIndex(item => item.label === chosen.label);
      const imageBuffer = await drawRouletteWheel(items, winnerIndex);

      await interaction.channel.send({
        files: [{ attachment: imageBuffer, name: 'roulette-result.png' }]
      });

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

      users[userId] = user;
      writeJSON(path.join(__dirname, '../data/users.json'), users);

      await interaction.reply({ content: `🎰 النتيجة: **${chosen.label}**!`, ephemeral: false });
      if (resultMessage) await interaction.channel.send(resultMessage);
    }

    // 📈 الاستثمار
    else if (customId.startsWith('invest_')) {
      const stockName = customId.split('_')[1];
      const users = readJSON(path.join(__dirname, '../data/users.json'));
      const stocks = readJSON(path.join(__dirname, '../data/stocks.json'));

      const user = users[userId] || { coins: 0 };
      const stock = stocks.find(s => s.name === stockName);

      if (!stock) return interaction.reply({ content: '❌ الشركة غير موجودة.', ephemeral: true });

      await interaction.reply({
        content: `💰 كم تريد أن تستثمر في سهم **${stock.name}**؟\n📈 النسبة الحالية: ${(stock.rate * 100).toFixed(1)}%\n✍️ اكتب المبلغ الذي تريد استثماره (مثلاً: \\500\\)`,
        ephemeral: true
      });

      const filter = m => m.author.id === userId;
      const collector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });

      collector.on('collect', msg => {
        const amount = parseInt(msg.content);
        if (isNaN(amount) || amount <= 0) return msg.reply('❌ يجب إدخال مبلغ صالح.');
        if (user.coins < amount) return msg.reply('❌ لا تملك كوينز كافية.');

        const profit = Math.floor(amount * stock.rate);
        user.coins += profit - amount;

        users[userId] = user;
        writeJSON(path.join(__dirname, '../data/users.json'), users);

        msg.reply(`✅ تم استثمار ${amount} كوين في **${stock.name}**\n📈 الربح: ${profit} كوين\n💼 الرصيد الجديد: ${user.coins}`);
      });

      collector.on('end', collected => {
        if (collected.size === 0) interaction.followUp({ content: '⌛ انتهى الوقت ولم يتم إدخال مبلغ.', ephemeral: true });
      });
    }
  }
};
