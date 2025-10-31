// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // "Bearer <token>" の形式からトークン部分のみを抽出
    const token = authHeader.split(' ')[1];
    
    // トークンを検証
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // 検証成功後、リクエストオブジェクトにユーザーIDを追加
    req.user = { id: decodedToken.id };
    
    // 次の処理へ進む
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};