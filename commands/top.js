const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fetch = require('node-fetch');

module.exports = {
  name: "توب",
  description: "عرض أغنى 9 أعضاء",
  async execute(message) {
    const usersPath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    const canvas = createCanvas(900, 600);
    const ctx = canvas.getContext('2d');

    const bg = await loadImage(path.join(__dirname, '../assets/top-bg.png'));
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // ترتيب أغنى 9 أعضاء من ملف users.json
    const sortedUsers = Object.entries(users)
      .map(([id, data]) => ({
        id,
        coins: data.coins || 0
      }))
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 9);

    // جلب بيانات الأعضاء (اسم + صورة)
    const topAvatars = await Promise.all(sortedUsers.map(async user => {
      const member = await message.guild.members.fetch(user.id).catch(() => null);
      return {
        avatar: member?.user.displayAvatarURL({ format: 'png' }) || null,
        username: member?.user.username || "غير معروف",
        coins: user.coins
      };
    }));

    // المراكز 1 - 3 (المنصة)
    const podiums = [
      { x: 390, y: 190 }, // 1
      { x: 230, y: 230 }, // 2
      { x: 500, y: 230 }  // 3
    ];
    const podiumColors = ['#FFD700', '#C0C0C0', '#cd7f32'];

    for (let i = 0; i < 3; i++) {
      const pos = podiums[i];
      const data = topAvatars[i];

      if (!data) continue;

      const img = await loadImage(data.avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x + 40, pos.y + 40, 40, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, pos.x, pos.y, 80, 80);
      ctx.restore();

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = podiumColors[i];
      ctx.textAlign = 'center';
      ctx.fillText(data.username, pos.x + 40, pos.y + 130);
      ctx.fillText(`${data.coins} 🪙`, pos.x + 40, pos.y + 155);
    }

    // المراكز 4 - 9 (مستطيلات يمين)
    const rightPositions = [
      { x: 665, y: 180 },  // 4
      { x: 665, y: 250 },  // 5
      { x: 665, y: 320 },  // 6
      { x: 665, y: 390 },  // 7
      { x: 665, y: 450 },  // 8
      { x: 665, y: 520 }   // 9
    ];

    for (let i = 3; i < 9; i++) {
      const pos = rightPositions[i - 3];
      const data = topAvatars[i];

      if (!data) continue;

      const img = await loadImage(data.avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, pos.x - 18, pos.y - 18, 36, 36);
      ctx.restore();

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(data.username, pos.x + 30, pos.y - 5);
      ctx.fillText(`${data.coins} 🪙`, pos.x + 30, pos.y + 15);
    }

    const buffer = canvas.toBuffer('image/png');
    const attachment = { files: [{ attachment: buffer, name: 'top.png' }] };
    await message.channel.send({ content: `🏆 أغنى أعضاء NEXO2`, ...attachment });
  }
};
