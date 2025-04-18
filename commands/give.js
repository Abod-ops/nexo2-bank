const fs = require('fs');
const path = require('path');

module.exports = {
  name: "اعطاء",
  description: "لإعطاء كوينز من قبل الإدارة فقط",
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ هذا الأمر مخصص فقط للإداريين.");
    }

    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply("⚠️ الاستخدام: #اعطاء @عضو 100");
    }

    const usersPath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath));

    if (!users[target.id]) users[target.id] = {};
    users[target.id].coins = (users[target.id].coins || 0) + amount;

    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    return message.channel.send(`✅ تم منح ${amount} 🪙 إلى ${target.username} بواسطة ${message.author.username}`);
  }
};
