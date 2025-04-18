const { AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'مساعدة',
  description: 'يعرض دليل استخدام أوامر البنك',
  async execute(message) {
    const imagePath = path.join(__dirname, '../assets/help-banner.png');
    const attachment = new AttachmentBuilder(imagePath);

    await message.reply({
      content: '📘 هذا هو دليل NEXO2 BANK:',
      files: [attachment]
    });
  }
};
