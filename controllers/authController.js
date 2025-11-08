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

    user.isActivated = true;
    await user.save();

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    // 成功レスポンスを統一
    res.status(200).json({
      status: 'success',
      data: { token, user }
    });
  } catch (error) {
    next(error); // エラーを errorHandler ミドルウェアに渡す
  }
};