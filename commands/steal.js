const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = {
  name: "سرقة",
  description: "حاول سرقة كوينز من لاعب آخر",
  async execute(message, args) {
    const usersFilePath = path.join(__dirname, '../data/users.json');

    // قراءة بيانات المستخدمين
    let users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

    const thief = message.author;
    const member = message.member;
    const victim = message.mentions.users.first();

    // تحقق من وجود منشن
    if (!victim) {
      return message.channel.send("❌ لازم تعمل منشن للشخص اللي تبي تسرقه.");
    }

    // منع سرقة نفسك (إلا لو Admin)
    if (thief.id === victim.id && !member.permissions.has('Administrator')) {
      return message.channel.send("❌ ما تقدر تسرق نفسك إلا لو عندك صلاحيات Admin.");
    }

    // تأكد من وجود بيانات الحسابات
    if (!users[thief.id]) users[thief.id] = { balance: 0 };
    if (!users[victim.id]) users[victim.id] = { balance: 0 };

    // تحقق من رصيد الضحية
    if (users[victim.id].balance <= 0) {
      return message.channel.send(`❌ ${victim.username} ما عنده كوينز تقدر تسرقها!`);
    }

    // 🎲 توليد سؤال حسابي بسيط
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operator = Math.random() > 0.5 ? '+' : '-';

    const bigger = Math.max(num1, num2);
    const smaller = Math.min(num1, num2);

    const questionText = operator === '+' 
      ? `${num1} + ${num2} = ?`
      : `${bigger} - ${smaller} = ?`;

    const correctAnswer = operator === '+' 
      ? num1 + num2
      : bigger - smaller;

    // 🎨 تجهيز الصورة
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const bg = await loadImage(path.join(__dirname, '../assets/arena-bg.png'));
    ctx.drawImage(bg, 0, 0, width, height);

    const thiefAvatar = await loadImage(thief.displayAvatarURL({ format: 'png' }));
    const victimAvatar = await loadImage(victim.displayAvatarURL({ format: 'png' }));

    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 200, 80, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(thiefAvatar, 70, 120, 160, 160);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(650, 200, 80, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(victimAvatar, 570, 120, 160, 160);
    ctx.restore();

    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(thief.username, 150, 330);
    ctx.fillText(victim.username, 650, 330);

    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`جاوب على: ${questionText}`, width / 2, 370);

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#00ffff';
    ctx.fillText(`⏳ عندك 15 ثانية`, width / 2, 40);

    const buffer = canvas.toBuffer('image/png');
    const attachment = { files: [{ attachment: buffer, name: 'challenge.png' }] };

    await message.channel.send({ content: `🥷 **${thief.username}** يحاول سرقة **${victim.username}**!`, ...attachment });

    // 🔹 انتظار الإجابة
    const filter = response => response.author.id === thief.id;

    message.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] })
      .then(collected => {
        const answer = parseInt(collected.first().content);

        if (answer === correctAnswer) {
            const maxSteal = Math.min(100, users[victim.id].balance);
            const amount = Math.floor(Math.random() * maxSteal) + 1;

            users[victim.id].balance -= amount;
            users[thief.id].balance += amount;

            fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

            message.channel.send(`✅ تمت السرقة بنجاح! ${thief.username} سرق ${amount} كوينز من ${victim.username}`);
        } else {
            message.channel.send(`🚨 إجابة خاطئة! تم القبض عليك يا ${thief.username}.`);
        }
      })
      .catch(() => {
        message.channel.send(`⌛ انتهى الوقت! فشلت عملية السرقة.`);
      });
  }
}
