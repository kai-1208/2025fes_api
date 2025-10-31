// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.login = async (req, res, next) => { // next を引数に追加
  try {
    const { id, pass } = req.body;
    const user = await User.findOne({ id });
    if (!user) {
      const error = new Error('Authentication failed.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(pass, user.pass);
    if (!isMatch) {
      const error = new Error('Authentication failed.');
      error.statusCode = 401;
      throw error;
    }

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