const fs = require('fs');
const path = require('path');
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

GlobalFonts.registerFromPath('./assets/Amiri-1.001/Amiri-Bold.ttf', 'Amiri');

module.exports = {
  name: 'مهمة',
  description: 'يحصل المستخدم على مهمة عسكرية سرية',
  async execute(message, args, client) {
    const missionsPath = path.join(__dirname, '../data/missions.json');
    const activePath = path.join(__dirname, '../data/activeMissions.json');

    const userID = message.author.id;
    const username = message.author.username;

    const missions = JSON.parse(fs.readFileSync(missionsPath));
    const activeMissions = JSON.parse(fs.readFileSync(activePath));
    const isAdmin = message.member.permissions.has('Administrator');

    if (activeMissions[userID] && !isAdmin) {
      return message.reply('🚫 لديك مهمة نشطة بالفعل. يجب إنهاؤها أولاً.');
    }

    const mission = missions[Math.floor(Math.random() * missions.length)];
    const reward = Math.floor(Math.random() * 81) + 20;

    activeMissions[userID] = {
      question: mission.text,
      answer: mission.answer || mission.answers,
      reward,
      timestamp: Date.now()
    };

    fs.writeFileSync(activePath, JSON.stringify(activeMissions, null, 2));

    const canvas = createCanvas(700, 550);
    const ctx = canvas.getContext('2d');

    const bgPath = path.join(__dirname, '../assets/mission-card-base.webp');
    const bgBuffer = fs.readFileSync(bgPath);
    const bgImage = await loadImage(bgBuffer);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'right';
    ctx.direction = 'rtl';

    ctx.fillStyle = '#00f7ff';
    ctx.font = 'bold 26px Amiri';
    ctx.fillText('مهمة سرية', 640, 60);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px Amiri';
    ctx.fillText(`العميل: ${username}..`, 285, 230);

    ctx.font = '20px Amiri';
    ctx.fillText(`مهمة رقم: ${Math.floor(Math.random() * 900 + 100)}`, 285, 260);

    ctx.fillStyle = 'gold';
    ctx.font = 'bold 24px Amiri';
    ctx.fillText(mission.text, 640, 460);

    ctx.fillStyle = '#ccc';
    ctx.font = '18px Amiri';
    ctx.fillText('مهمتك تتطلب تركيزًا وسرعة استجابة.', 640, 490);

    ctx.fillStyle = '#888';
    ctx.font = '16px Amiri';
    ctx.fillText('— NEXO2 Intelligence', 600, 530);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`start-mission-${userID}`)
        .setLabel('بدء المهمة ✅')
        .setStyle(ButtonStyle.Success)
    );

    const buffer = canvas.toBuffer('image/png');
    const attachment = new AttachmentBuilder(buffer, { name: 'mission.png' });

    await message.reply({
      content: '📡 تم إسناد مهمة جديدة. جاهز للتنفيذ؟',
      files: [attachment],
      components: [row]
    });
  }
};
