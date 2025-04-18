const fs = require('fs');
const path = require('path');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

module.exports = {
  name: "روليت",
  description: "اللعبة التفاعلية من NEXO2-BANK",
  async execute(message) {
    const userId = message.author.id;

    const usersPath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = users[userId] || { coins: 0 };

    const cost = 150;

    if (user.coins < cost) {
      const diff = cost - user.coins;
      return message.reply(`❌ لا تمتلك كوينز كافية.\nتحتاج ${diff} 🪙 زيادة لتبدأ.`);
    }

    // تجهيز صورة الترحيب
    const imagePath = path.join(__dirname, '../assets/roulette-start.png');
    const attachment = new AttachmentBuilder(imagePath);
    
    // زر "ابدأ"
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`start_roulette_${userId}`)
        .setLabel(`🎯 ابدأ بـ ${cost} 🪙`)
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({
      content: `🎰 **مرحباً بك في NEXO2 BANK ROULETTE**`,
      files: [attachment],
      components: [row]
    });
  }
};
