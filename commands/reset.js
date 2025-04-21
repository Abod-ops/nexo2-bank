const fs = require('fs');
const path = require('path');

module.exports = {
  name: "تصفير",
  description: "تصفير كوينات عضو",
  async execute(message, args) {
    // تحقق من صلاحية الإداري
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    }

    // التحقق من وجود منشن أو ID
    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      return message.reply("❌ الرجاء منشن العضو أو كتابة الـ ID الخاص به.");
    }

    const userId = target.id;
    const usersPath = path.join(__dirname, '../data/users.json');

    // قراءة الملف
    let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    if (!users[userId]) {
      return message.reply("❌ هذا المستخدم لا يملك كوينات.");
    }

    users[userId].coins = 0;

    // حفظ التعديلات
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    message.reply(`✅ تم تصفير كوينات ${target.username} بنجاح.`);
  }
};
