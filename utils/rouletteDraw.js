const { createCanvas } = require('@napi-rs/canvas');

async function drawRouletteWheel(items, winnerIndex) {
  const canvas = createCanvas(500, 500);
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 200;
  const angleStep = (2 * Math.PI) / items.length;

  const colors = [
    '#1f3b57', // رمادي غامق - سيء
    '#0074e0', // أزرق ساطع - جيد
    '#2c2f34', // رمادي غامق - سيء
    '#0097ff', // أزرق متوسط - جيد
    '#3b3b3b', // رمادي داكن - سيء
    '#00bfff', // أزرق فاتح - جيد
    '#4a4a4a', // رمادي متوسط - سيء
    '#1faaff', // أزرق سماوي - جيد
    '#2a2a2a', // رمادي فحمي - سيء
    '#3399ff'  // أزرق كلاسيك - جيد
  ];
  

  for (let i = 0; i < items.length; i++) {
    const angle = i * angleStep;

    // Slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, angle, angle + angleStep);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // Text
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle + angleStep / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(items[i].label, radius - 10, 5);
    ctx.restore();
  }

  // Draw center circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
  ctx.fillStyle = '#222';
  ctx.fill();

  // Draw pointer
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius - 10);
  ctx.lineTo(centerX - 10, centerY - radius - 30);
  ctx.lineTo(centerX + 10, centerY - radius - 30);
  ctx.closePath();
  ctx.fillStyle = '#ff0000';
  ctx.fill();

  // Rotate to point to winner
  const rotation = -((winnerIndex + 0.5) * angleStep);
  const finalCanvas = createCanvas(500, 500);
  const finalCtx = finalCanvas.getContext('2d');

  finalCtx.translate(centerX, centerY);
  finalCtx.rotate(rotation);
  finalCtx.translate(-centerX, -centerY);
  finalCtx.drawImage(canvas, 0, 0);

  return finalCanvas.toBuffer('image/png');
}

module.exports = { drawRouletteWheel };
