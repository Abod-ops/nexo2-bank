const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "اسهم",
  description: "عرض حالة السوق للشركات العالمية",
  async execute(message) {
    const stocksPath = path.join(__dirname, '../data/stocks.json');
    const stocks = JSON.parse(fs.readFileSync(stocksPath, 'utf8'));

    const embed = new EmbedBuilder()
      .setTitle("📊 NEXO2 STOCK MARKET")
      .setColor("#00b0f4")
      .setDescription("تحديث تلقائي كل 10 دقائق.\n\nاختر الشركة المناسبة للاستثمار عبر أمر **#استثمار**.");

    const lines = [];

    for (let i = 0; i < stocks.length; i += 5) {
      const slice = stocks.slice(i, i + 5).map(stock => {
        const rate = (stock.rate * 100).toFixed(0);
        const arrow = stock.rate >= 0 ? '🔼' : '🔽';
        const sign = stock.rate >= 0 ? '+' : '';
        return `${stock.name} ${arrow} ${sign}${rate}%`;
      });

      lines.push(slice.join(' │ '));
    }

    embed.addFields({ name: "حالة السوق الحالية:", value: lines.join('\n') });
    embed.setFooter({ text: "بيانات السوق محدثة تلقائيًا" });

    await message.reply({ embeds: [embed] });
  }
};
