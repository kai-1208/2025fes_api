// create_slideshow.js
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://semirarely-expositional-aria.ngrok-free.dev';
const ADMIN_API_KEY = '2025fes-api-key';

// --- 入力・出力ファイル設定 ---
const CREDENTIALS_FILE = path.join(__dirname, 'credentials.json');
const SLIDESHOW_HTML_FILE = path.join(__dirname, 'qrcode_slideshow.html');

/**
 * ユーザー情報（credentials.json）を読み込む
 */
function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    console.error(`✗ エラー: ${CREDENTIALS_FILE} が見つかりません。`);
    console.error('先に generate.js を実行して、ユーザー情報ファイルを作成してください。');
    process.exit(1);
  }
  console.log(`✓ ${CREDENTIALS_FILE} を読み込んでいます...`);
  return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
}

/**
 * QRコードスライドショー用のHTMLファイルを生成する
 * @param {Array} users ユーザー情報の配列
 */
function createSlideshowHtml(users) {
  console.log('自動進行機能付きスライドショーHTMLを生成しています...');
  
  const usersJson = JSON.stringify(users.map(u => ({ id: u.id, src: `./qrcodes/${u.id}.png` })));

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>受付用QRコードスライドショー</title>
      <style>
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #111; color: #fff; font-family: sans-serif; }
        .slide-container { display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; transition: background-color 0.5s; }
        .slide-container.activated { background-color: #28a745; }
        #qr-image { max-width: 80vw; max-height: 80vh; border: 10px solid #fff; border-radius: 12px; }
        #qr-info { margin-top: 20px; font-size: 2rem; font-weight: bold; }
        .instructions { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px;}
      </style>
    </head>
    <body>
      <div class="slide-container" id="slide-container">
        <img id="qr-image" src="" alt="QR Code">
        <p id="qr-info"></p>
      </div>
      <div class="instructions">
        <p>← → キーで手動切り替え (F11キーで全画面表示推奨)</p>
      </div>

      <script>
        // --- 設定 ---
        const API_BASE_URL = '${API_BASE_URL}';
        const ADMIN_API_KEY = '${ADMIN_API_KEY}';
        const POLLING_INTERVAL_MS = 2000;

        // --- グローバル変数 ---
        const users = ${usersJson};
        let currentIndex = 0;
        let pollingIntervalId = null;

        // --- DOM要素 ---
        const slideContainer = document.getElementById('slide-container');
        const qrImage = document.getElementById('qr-image');
        const qrInfo = document.getElementById('qr-info');

        /** QRコードを表示し、ポーリングを開始する */
        function showQr(index) {
          if (index < 0 || index >= users.length) return;
          if (pollingIntervalId) clearInterval(pollingIntervalId);
          currentIndex = index;
          const user = users[index];
          qrImage.src = user.src;
          qrInfo.textContent = \`No. \${index + 1} / \${users.length}\`;
          slideContainer.classList.remove('activated');
          startPolling(user.id);
        }
        
        /** 指定されたユーザーIDのステータス確認を開始 */
        function startPolling(userId) {
          pollingIntervalId = setInterval(async () => {
            try {
              const response = await fetch(\`\${API_BASE_URL}/api/users/status/\${userId}\`, {
                headers: { 'x-api-key': ADMIN_API_KEY, 'ngrok-skip-browser-warning': 'true' }
              });
              if (!response.ok) return; // サーバーが落ちている場合などは何もしない
              const result = await response.json();
              if (result.data && result.data.isActivated) {
                clearInterval(pollingIntervalId);
                handleSuccess();
              }
            } catch (error) {
              console.error('Polling error:', error);
            }
          }, POLLING_INTERVAL_MS);
        }

        /** 読み取り成功時の処理 */
        function handleSuccess() {
          slideContainer.classList.add('activated');
          qrInfo.textContent = '読み取り成功！';
          setTimeout(() => {
            showQr(currentIndex + 1);
          }, 1500);
        }

        /** キーボード操作 */
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
  console.log(`✓ 自動進行機能付きスライドショーHTMLファイルを ${SLIDESHOW_HTML_FILE} に生成しました。`);
}

/**
 * メイン実行関数
 */
function main() {
  console.log('--- スライドショーHTML生成プロセスを開始します ---');
  const users = loadCredentials();
  createSlideshowHtml(users);
  console.log('--- プロセスが完了しました ---');
  console.log(`次に、ブラウザで ${SLIDESHOW_HTML_FILE} を開いてスクリーンに表示してください。`);
}

main();