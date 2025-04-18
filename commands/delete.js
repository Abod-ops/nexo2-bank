const fs = require('fs');
const path = require('path');

module.exports = {
  name: "حذف",
  description: "لحذف كوينز من أي عضو (إداري فقط)",
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ هذا الأمر مخصص فقط للإداريين.");
    }

    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply("⚠️ الاستخدام: #حذف @عضو 100");
    }

    const usersPath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath));

    if (!users[target.id]) users[target.id] = { coins: 0 };

    const currentCoins = users[target.id].coins || 0;

    if (currentCoins < amount) {
      return message.reply("❌ هذا العضو لا يملك كوينز كافية.");
    }

    // خصم المبلغ بدون تحويل
    users[target.id].coins -= amount;

    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    message.channel.send(`🗑️ تم حذف ${amount} 🪙 من ${target.username} بواسطة ${message.author.username}`);
  }
};
