// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// const bcrypt = require('bcryptjs');

exports.login = async (req, res, next) => { // next を引数に追加
  try {
    const { id, id2 } = req.body;
    const user = await User.findOne({ id, id2 });
    if (!user) {
      const error = new Error('Authentication failed.');
      error.statusCode = 401;
      throw error;
    }

    // ユーザーがアクティブかチェック
    if (user.isActivated) {
      const error = new Error('This QR code has already been used. Please use the next one.');
      error.statusCode = 409; // 409 Conflict: 競合/既に使用済みを示す
      throw error;
    }

    // 初回ログイン時アクティブにする
    user.isActivated = true;
    await user.save();

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '3h' });
    
    // 成功レスポンスを統一
    res.status(200).json({
      status: 'success',
      data: { token, user }
    });
  } catch (error) {
    next(error); // エラーを errorHandler ミドルウェアに渡す
  }
};