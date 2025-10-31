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

    // ★ 更新するフィールドを動的に構築するためのオブジェクト
    const updateOperation = {
      $inc: {}
    };

    // 1. メインのフラグを更新対象に追加
    updateOperation.$inc[`flags.${flagName}`] = increment;

    // ★ 2. 'common' ルールの実装
    //    casinoのコインや負け回数以外のゲームプレイに関わるフラグが更新された場合、
    //    'games_played'も1増やす
    const gamePlayFlags = [
      'casino_roulette_played', 'casino_poker_played', 'casino_blackjack_played',
      'dungeon_enemies_defeated', 'dungeon_chests_opened', 'dungeon_player_deaths',
      'dungeon_floors_cleared', 'code_problems_solved', 'code_failures', 'code_solo_clears'
    ];
    if (gamePlayFlags.includes(flagName)) {
      updateOperation.$inc['flags.games_played'] = 1;
    }

    // ★ 3. 'casino' ルールの実装

    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      updateOperation, // ★ 構築した更新オペレーションを適用
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!updatedUser) {
      const error = new Error('User to update not found.');
      error.statusCode = 404;
      throw error;
    }
    
    res.status(200).json({
      status: 'success',
      data: { 
        message: 'Flag updated successfully.',
        updatedFlags: updatedUser.flags 
      }
    });
  } catch (error) {
    next(error);
  }
};