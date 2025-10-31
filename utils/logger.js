// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info', // 'info'レベル以上のログを記録
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // エラーログを 'logs/error.log' ファイルに保存
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // 全てのログを 'logs/combined.log' ファイルに保存
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// 開発環境では、コンソールにもログを出力する
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;