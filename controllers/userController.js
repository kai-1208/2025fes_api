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
    const { userId, updates } = req.body; // 'updates' はフラグ名と加算値のペアの配列

    if (!userId || !Array.isArray(updates) || updates.length === 0) {
      const error = new Error('Invalid request. userId and updates array are required.');
      error.statusCode = 400;
      throw error;
    }

    const updateOperation = {
      $inc: {}
    };
    let isGamePlayed = false;

    // 1. リクエストされた全フラグを更新対象に追加
    for (const update of updates) {
      if (typeof update.flagName === 'string' && typeof update.increment === 'number') {
        updateOperation.$inc[`flags.${update.flagName}`] = update.increment;

        // 2. 'common' ルールの判定
        const gamePlayFlags = [
          'casino_roulette_played', 'casino_poker_played', 'casino_blackjack_played',
          'dungeon_enemies_defeated', 'dungeon_chests_opened', 'dungeon_player_deaths',
          'dungeon_floors_cleared', 'code_problems_solved', 'code_failures', 'code_solo_clears'
        ];
        if (gamePlayFlags.includes(update.flagName) && update.increment > 0) {
          isGamePlayed = true;
        }
      }
    }

    // 3. 'common' ルールを適用 (いずれかのゲームがプレイされていたらgames_playedを1増やす)
    if (isGamePlayed) {
      updateOperation.$inc['flags.games_played'] = 1;
    }

    // 更新オペレーションに何もない場合はエラー
    if (Object.keys(updateOperation.$inc).length === 0) {
      const error = new Error('Invalid updates format.');
      error.statusCode = 400;
      throw error;
    }

    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      updateOperation,
      { new: true }
    );

    if (!updatedUser) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    
    res.status(200).json({
      status: 'success',
      data: { 
        message: 'Flags updated successfully.',
        updatedFlags: updatedUser.flags 
      }
    });
  } catch (error) {
    next(error);
  }
};

// ユーザーが自身の名前を更新するための新しい関数
exports.updateMyName = async (req, res, next) => {
  try {
    // リクエストボディから新しい名前を取得
    const { name: newName } = req.body;

    // 入力値の検証
    if (!newName || newName.trim().length === 0) {
      const error = new Error('Name cannot be empty.');
      error.statusCode = 400; // Bad Request
      throw error;
    }
    if (newName.length > 20) {
      const error = new Error('Name cannot be longer than 20 characters.');
      error.statusCode = 400;
      throw error;
    }

    // authMiddlewareが設定したユーザーIDを使って、DBを更新
    const updatedUser = await User.findOneAndUpdate(
      { id: req.user.id },    // どのユーザーを？ -> ログイン中のユーザー
      { name: newName },      // 何を更新？ -> nameフィールドを新しい値に
      { new: true }           // new:true で更新後のユーザー情報を返す
    );

    if (!updatedUser) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    // 統一された成功レスポンスを返す
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    next(error);
  }
};