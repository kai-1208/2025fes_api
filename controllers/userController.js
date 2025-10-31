// controllers/userController.js
const User = require('../models/User');

// ログイン中のユーザー情報を取得する処理
exports.getMe = async (req, res, next) => {
  try {
    // authMiddlewareによってreq.user.idがセットされている
    const user = await User.findOne({ id: req.user.id });

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    // 成功レスポンスを統一
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    // エラーを中央エラーハンドラに渡す
    next(error);
  }
};

// クエストシステムからフラグを更新する処理
exports.updateFlag = async (req, res, next) => {
  try {
    const { userId, flagName, increment } = req.body;
    
    // $inc オペレーターを使って指定したフィールドの値をアトミックに増減させる
    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      { $inc: { [`flags.${flagName}`]: increment } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!updatedUser) {
      // upsert:true のため、基本的にはこのエラーは発生しないが念のため
      const error = new Error('User to update not found.');
      error.statusCode = 404;
      throw error;
    }
    
    // 成功レスポンスを統一
    res.status(200).json({
      status: 'success',
      data: { 
        message: 'Flag updated successfully.',
        updatedFlags: updatedUser.flags 
      }
    });
  } catch (error) {
    // エラーを中央エラーハンドラに渡す
    next(error);
  }
};