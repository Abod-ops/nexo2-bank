const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

GlobalFonts.registerFromPath('./assets/Amiri-1.001/Amiri-Bold.ttf', 'Amiri');

module.exports = {
  name: 'هدية',
  description: 'أرسل كوينز كهدية لأي شخص في السيرفر.',
  async execute(message, args, client) {
    const senderID = message.author.id;
    const senderName = message.author.username;
    const mentionedUser = message.mentions.users.first();

    if (!mentionedUser) return message.reply('❌ يجب منشن الشخص الذي تريد إهداءه.');
    if (!args[1] || isNaN(args[1])) return message.reply('❌ يجب تحديد الكمية بشكل صحيح.');

    const amount = parseInt(args[1]);
    const isAdmin = message.member.permissions.has('Administrator');
    if (mentionedUser.id === senderID && !isAdmin) {
      return message.reply('❌ لا يمكنك إرسال هدية لنفسك.');
    }

    const dataPath = path.join(__dirname, '../data/users.json');
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));

    const users = JSON.parse(fs.readFileSync(dataPath));
    if (!users[senderID]) users[senderID] = { coins: 0 };
    if (!users[mentionedUser.id]) users[mentionedUser.id] = { coins: 0 };

    if (users[senderID].coins < amount && !isAdmin) {
      return message.reply('❌ لا تمتلك كوينز كافية لإرسال الهدية.');
    }

    if (!isAdmin) users[senderID].coins -= amount;
    users[mentionedUser.id].coins += amount;

    fs.writeFileSync(dataPath, JSON.stringify(users, null, 2));

    // بطاقة الهدية
    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');

    // خلفية غالاكسي بنفسجي × وردي
    ctx.fillStyle = '#0b0c23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // نجوم إلكترونية بالخلفية
    for (let i = 0; i < 150; i++) {
      ctx.fillStyle = 'white';
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillRect(x, y, 1, 1);
    }

    // إطار خارجي متقطع
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    ctx.setLineDash([]);

    // صور البروفايل
    const senderAvatar = await loadImage(message.author.displayAvatarURL({ format: 'png' }));
    const receiverAvatar = await loadImage(mentionedUser.displayAvatarURL({ format: 'png' }));

    // دوائر نيون
    function drawNeonCircle(x, y) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + 40, y + 40, 42, 0, Math.PI * 2);
      ctx.strokeStyle = '#00f7ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00f7ff';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }

    drawNeonCircle(150, 60);
    drawNeonCircle(600, 60);

    ctx.save();
    ctx.beginPath();
    ctx.arc(190, 100, 40, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(mentionedUser.id === senderID ? receiverAvatar : senderAvatar, 150, 60, 80, 80);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(640, 100, 40, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(mentionedUser.id === senderID ? senderAvatar : receiverAvatar, 600, 60, 80, 80);
    ctx.restore();

    // أسماء المستخدمين
    ctx.font = 'bold 20px Amiri';
    ctx.fillStyle = '#00f7ff';
    ctx.textAlign = 'center';
    ctx.fillText(`${mentionedUser.username}.`, 190, 155);
    ctx.fillText(`${senderName}.`, 640, 155);

    // عنوان البطاقة
    ctx.font = 'bold 28px Amiri';
    ctx.fillStyle = 'gold';
    ctx.shadowColor = 'gold';
    ctx.shadowBlur = 15;
    ctx.fillText('NEXO2 BANK', canvas.width / 2, 220);
    ctx.shadowBlur = 0;

    // رمز الهدية
    ctx.font = 'bold 50px Amiri';
    ctx.fillText('', canvas.width / 2, 260);

    // الرسالة
    ctx.font = 'bold 22px Amiri';
    ctx.fillText(`تم إهداء ${amount} كوين 🎉`, canvas.width / 2, 300);

    ctx.font = 'bold 20px Amiri';
    ctx.fillStyle = 'yellow';
    ctx.fillText(`من ${senderName} إلى ${mentionedUser.username}.`, canvas.width / 2, 330);

    // التوقيع
    ctx.fillStyle = '#888';
    ctx.font = '16px Amiri';
    ctx.fillText('— NEXO2 Intelligence', canvas.width / 2, 460);

    // التاريخ
    const today = new Date();
    const formatted = today.toLocaleDateString('ar-EG');
    ctx.fillText(`📆 ${formatted}`, canvas.width / 2, 480);

    const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'gift.png' });

    await message.reply({
      content: '🎉 تمت إرسال الهدية بنجاح!',
      files: [attachment],
    });
  },
};
