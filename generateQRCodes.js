// generateQRCodes.js
const QRCode = require('qrcode');
const fs = require('fs');

// QRコードを保存するフォルダを作成
const outputDir = './qrcodes';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// ★ここに、ユーザー一括登録APIが返したユーザーリストを貼り付ける
const users = [
  { "id": "aB1cD2", "pass": "eF3gH4iJ" },
  { "id": "kL5mN6", "pass": "oP7qR8sT" },
  { "id": "uV9wX0", "pass": "yZ1aB2cD" },
  { "id": "eF3gH4", "pass": "iJ5kL6mN" },
  { "id": "oP7qR8", "pass": "sT9uV0wX" }
];

const webAppUrl = 'https://omuct-fest2025.io/index.html';

// 各ユーザーに対してQRコードを生成
users.forEach(user => {
  const fullUrl = `${webAppUrl}?id=${user.id}&pass=${user.pass}`;
  const outputPath = `${outputDir}/user-${user.id}.png`;

  QRCode.toFile(outputPath, fullUrl, (err) => {
    if (err) throw err;
    console.log(`Successfully generated QR code for user ${user.id} at ${outputPath}`);
  });
});