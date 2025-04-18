const fs = require('fs');
const path = require('path');

const stocksPath = path.join(__dirname, './data/stocks.json');

module.exports = function updateRates() {
    // نفس كود التحديث
  };
  


function updateRates() {
  const stocks = JSON.parse(fs.readFileSync(stocksPath, 'utf8'));

  for (let stock of stocks) {
    const isProfit = Math.random() > 0.3; // 70% ربح - 30% خسارة
    if (isProfit) {
      stock.rate = +(Math.random() * 1).toFixed(2); // 0.00 إلى 1.00
    } else {
      stock.rate = -((Math.random() * 0.5).toFixed(2)); // -0.00 إلى -0.50
    }
  }

  fs.writeFileSync(stocksPath, JSON.stringify(stocks, null, 2));
  console.log("✅ تم تحديث نسب الأسهم.");
}

console.log('⏱️ [INFO] تم تحديث أسعار الأسهم عند:', new Date().toLocaleTimeString());


updateRates();
