const fs = require('fs');
const path = require('path');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: "استثمار",
  description: "ابدأ بالاستثمار في شركة من السوق",
  async execute(message) {
    const stocksPath = path.join(__dirname, '../data/stocks.json');
    const stocks = JSON.parse(fs.readFileSync(stocksPath, 'utf8'));

    const rows = [];
    let currentRow = new ActionRowBuilder();

    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      const rate = (stock.rate * 100).toFixed(0);
      const label = `${stock.name} - ${rate}%`;

      let style = ButtonStyle.Primary;
      if (stock.rate >= 0.25) style = ButtonStyle.Success;
      else if (stock.rate < 0) style = ButtonStyle.Danger;

      const button = new ButtonBuilder()
        .setLabel(label)
        .setCustomId(`invest_${stock.name}`)
        .setStyle(style);

      currentRow.addComponents(button);

      // Discord يسمح بـ 5 أزرار فقط بالصف الواحد
      if (currentRow.components.length === 5 || i === stocks.length - 1) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
      }
    }

    await message.reply({
      content: "💼 اختر الشركة التي ترغب بالاستثمار فيها:",
      components: rows
    });
  }
};
