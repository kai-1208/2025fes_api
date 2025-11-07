// generate.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const QRCode = require('qrcode');

const API_BASE_URL = 'https://semirarely-expositional-aria.ngrok-free.dev';
const ADMIN_API_KEY = '2025fes-api-key';
const USER_COUNT = 10; // 作成したいユーザーの数
const WEB_APP_URL = 'https://pinattutaro.github.io/festSystem2025';

// --- 出力設定 ---
const CREDENTIALS_FILE = path.join(__dirname, 'credentials.json');
const QR_CODES_DIR = path.join(__dirname, 'qrcodes');
const SLIDESHOW_HTML_FILE = path.join(__dirname, 'qrcode_slideshow.html');

/**
 * APIを叩いてユーザー情報を取得し、ファイルに保存する
 */
async function fetchCredentials() {
  console.log(`APIサーバーから${USER_COUNT}人分のユーザー情報を取得しています...`);
  try {
    const response = await axios.post(`${API_BASE_URL}/api/admin/create-users`, 
      { count: USER_COUNT },
      { headers: { 'x-api-key': ADMIN_API_KEY, 'ngrok-skip-browser-warning': 'true' } }
    );
    const users = response.data.data.users;
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(users, null, 2));
    console.log(`ユーザー情報を ${CREDENTIALS_FILE} に保存しました。`);
    return users;
  } catch (error) {
    console.error('APIからのユーザー情報取得に失敗しました:', error.response?.data || error.message);
    process.exit(1);
  }
}

/**
 * ユーザー情報からQRコード画像を生成する
 * @param {Array} users ユーザー情報の配列
 */
async function generateQrImages(users) {
  console.log('QRコード画像を生成しています...');
  if (!fs.existsSync(QR_CODES_DIR)) fs.mkdirSync(QR_CODES_DIR);

  for (const user of users) {
    const url = `${WEB_APP_URL}?id=${user.id}&id2=${user.id2}`;
    const outputPath = path.join(QR_CODES_DIR, `${user.id}.png`);
    await QRCode.toFile(outputPath, url, { width: 200 });
  }
  console.log(`${users.length}個のQRコード画像を ${QR_CODES_DIR} に生成しました。`);
}

/**
 * ★ QRコードスライドショー用のHTMLファイルを生成する
 * @param {Array} users ユーザー情報の配列
 */
function createSlideshowHtml(users) {
  console.log('スライドショー用のHTMLファイルを生成しています...');
  
  // ユーザーデータをJavaScriptの配列としてHTMLに埋め込む
  const usersJson = JSON.stringify(users.map(u => ({ id: u.id, src: `./qrcodes/${u.id}.png` })));

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>受付用QRコードスライドショー</title>
      <style>
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #111; color: #fff; font-family: sans-serif; }
        .slide-container { display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; }
        #qr-image { max-width: 80vw; max-height: 80vh; border: 10px solid #fff; border-radius: 12px; }
        #qr-info { margin-top: 20px; font-size: 2rem; font-weight: bold; }
        .instructions { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px;}
      </style>
    </head>
    <body>
      <div class="slide-container">
        <img id="qr-image" src="" alt="QR Code">
        <p id="qr-info"></p>
      </div>
      <div class="instructions">
        <p>← → キーでQRコードを切り替え (F11キーで全画面表示推奨)</p>
      </div>

      <script>
        const users = ${usersJson};
        let currentIndex = 0;

        const qrImage = document.getElementById('qr-image');
        const qrInfo = document.getElementById('qr-info');

        function showQr(index) {
          if (index < 0 || index >= users.length) return;
          currentIndex = index;
          const user = users[index];
          qrImage.src = user.src;
          qrInfo.textContent = \`No. \${index + 1} / \${users.length}\`;
        }

        document.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight') {
            showQr(currentIndex + 1);
          } else if (e.key === 'ArrowLeft') {
            showQr(currentIndex - 1);
          }
        });

        // 初期表示
        showQr(0);
      </script>
    </body>
    </html>
  `;

  fs.writeFileSync(SLIDESHOW_HTML_FILE, htmlContent);
  console.log(`✓ スライドショーHTMLファイルを ${SLIDESHOW_HTML_FILE} に生成しました。`);
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('--- QRコード生成プロセスを開始します ---');
  
  let users;
  if (fs.existsSync(CREDENTIALS_FILE)) {
    console.log(`${CREDENTIALS_FILE} が見つかりました。このファイルを使用します。`);
    users = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
  } else {
    users = await fetchCredentials();
  }

  await generateQrImages(users);
  createSlideshowHtml(users);

  console.log('--- 全てのプロセスが完了しました ---');
}

main();