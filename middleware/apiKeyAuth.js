// middleware/apiKeyAuth.js
require('dotenv').config();

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

module.exports = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key']; // リクエストヘッダーから'x-api-key'を取得

    if (!apiKey) {
      return res.status(401).json({ message: 'No API key provided.' });
    }

    if (apiKey !== ADMIN_API_KEY) {
      return res.status(403).json({ message: 'Forbidden: Invalid API key.' });
    }

    // APIキーが正しい場合のみ、次の処理へ進む
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error during API key validation.' });
  }
};