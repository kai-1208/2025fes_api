// middleware/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // エラーをログに記録
  logger.error(err.message, { stack: err.stack, url: req.originalUrl, method: req.method });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An internal server error occurred.';

  // 統一されたエラーレスポンスを返す
  res.status(statusCode).json({
    status: 'error',
    message: message,
  });
};

module.exports = errorHandler;