const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

GlobalFonts.registerFromPath('./assets/Amiri-1.001/Amiri-Bold.ttf', 'Amiri');

module.exports = {
  name: 'رصيد',
  description: 'يعرض رصيدك البنكي.',
  async execute(message, args, client) {
    const userID = message.author.id;
    const username = message.author.username;
    const avatarURL = message.author.displayAvatarURL({ format: 'png' });

    const dataPath = path.join(__dirname, '../data/users.json');
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));

    const rawData = fs.readFileSync(dataPath);
    const users = JSON.parse(rawData);
    if (!users[userID]) users[userID] = { coins: 0 };

    const coins = users[userID].coins;
    const formattedCoins = coins >= 1e6
      ? (coins / 1e6).toFixed(1) + 'M'
      : coins >= 1e3
      ? (coins / 1e3).toFixed(1) + 'K'
      : coins.toString();

    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // خلفية مجرة + تدرج نيون
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a002b');
    gradient.addColorStop(1, '#001f3f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // نجوم أكثر
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }



    // نجوم
for (let i = 0; i < 100; i++) {
    ctx.fillStyle = 'white';
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillRect(x, y, 1, 1);
  }

  

    // نيون اسم البنك
    ctx.fillStyle = '#00f7ff';
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 20;
    ctx.font = '32px Amiri';
    ctx.fillText('NEXO2 BANK', 60, 60);
    ctx.shadowBlur = 0;

    // صورة البروفايل دائرية
    const avatar = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 135, 60, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 60, 75, 120, 120);
    ctx.restore();

    // الاسم والرصيد
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Amiri';
    ctx.fillText(`الاسم`, 750, 130);
    ctx.fillText(username, 660, 130);

    ctx.fillStyle = 'gold';
    ctx.font = 'bold 26px Amiri';
    ctx.fillText(`الرصيد`, 750, 170);
    ctx.fillText(formattedCoins, 660, 170);

    // رقم البطاقة
    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 26px Amiri';
    ctx.fillText('1234 5678 9876 5432', 60, 260);
    ctx.font = '20px Amiri';
    ctx.fillText('CVV: 999', 60, 295);
    ctx.fillText('EXP: 12/29', 180, 295);



   // ختم مائي واضح في الخلفية
ctx.save();
ctx.translate(canvas.width / 2, canvas.height / 2);
ctx.rotate(-Math.PI / 6); // تدوير للخلفية (زاوية 30 درجة تقريبا)
ctx.font = 'bold 80px Amiri';
ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; // زيادة الشفافية شوي
ctx.textAlign = 'center';
ctx.fillText('NEXO2 SECURE', 0, 0);
ctx.restore();




    // الشريحة
    ctx.fillStyle = '#b3b3b3';
    ctx.fillRect(680, 45, 40, 25);

    // QR
    ctx.fillStyle = 'white';
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        if ((x + y) % 2 === 0) ctx.fillRect(700 + x * 5, 320 + y * 5, 5, 5);
      }
    }

    // نص افتراضي
    ctx.fillStyle = '#ccc';
    ctx.font = '18px Amiri';
    ctx.fillText(' فقط NEXO2 بطاقه افتراضيه للاستخدام داخل النظام البنكي في ', 50, 330);

    // إرسال البطاقة
    const attachment = {
      files: [{ attachment: canvas.toBuffer('image/png'), name: 'balance.png' }]
    };

    await message.reply(attachment);

    fs.writeFileSync(dataPath, JSON.stringify(users, null, 2));
  },
};
