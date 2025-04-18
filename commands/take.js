const fs = require('fs');
const path = require('path');

module.exports = {
  name: "اخذ",
  description: "لسحب كوينز من أي عضو من قبل الإدارة فقط",
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ هذا الأمر مخصص فقط للإداريين.");
    }

    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply("⚠️ الاستخدام: #اخذ @عضو 100");
    }

    const usersPath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath));

    if (!users[target.id]) users[target.id] = { coins: 0 };
    if (!users[message.author.id]) users[message.author.id] = { coins: 0 };

    const targetCoins = users[target.id].coins || 0;

    if (targetCoins < amount) {
      return message.reply("❌ لا يملك هذا العضو رصيد كافي.");
    }

    // سحب الفلوس
    users[target.id].coins -= amount;
    users[message.author.id].coins += amount;

    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    message.channel.send(`✅ تم سحب ${amount} 🪙 من ${target.username} وإضافتها لرصيد ${message.author.username}`);

    // رسالة خاصة للعضو (اختياري)
    try {
      target.send(`❌ تم سحب ${amount} 🪙 من رصيدك بواسطة الإدارة.`).catch(() => {});
    } catch {}
  }
};
