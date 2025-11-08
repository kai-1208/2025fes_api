// controllers/userController.js
const User = require('../models/User');
const Quest = require('../models/Quest');
const { generateNewQuest } = require('../utils/questGenerator');

// ログイン中のユーザー情報を取得する処理
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404; throw error;
    }

    // ユーザーにアクティブなクエストがない場合、ここで生成してあげる
    let needsSave = false;
    for (const category of ['casino', 'dungeon', 'code_editor']) {
      if (!user.activeQuests[category]) {
        user.activeQuests[category] = generateNewQuest(category, user.flags);
        needsSave = true;
      }
    }
    if (needsSave) {
      await user.save();
    }

    res.status(200).json({
      status: 'success',
      data: { user } // activeQuestsもuserオブジェクトに含まれて返される
    });
  } catch (error) {
    next(error);
  }
};

/**
 * クエスト達成をチェックし、達成していれば報酬を与え、新しいクエストを生成する
 * @param {Document} user - チェック対象のユーザーオブジェクト
 */
async function checkAndProcessQuestCompletion(user) {
  let questCompleted = false;

  for (const category of ['casino', 'dungeon', 'code_editor']) {
    const activeQuest = user.activeQuests[category];

    // アクティブなクエストがあり、目標フラグの値が目標値に達していたら
    if (activeQuest && (user.flags[activeQuest.targetFlag] || 0) >= activeQuest.targetValue) {
      console.log(`User ${user.id} completed quest: ${activeQuest.description}`);
      
      // 報酬を付与
      user.currency += activeQuest.rewardCurrency;
      user.experience += activeQuest.rewardExperience;
      
      // 新しいクエストを生成してセット
      user.activeQuests[category] = generateNewQuest(category, user.flags);
      questCompleted = true;
    }
  }

  if (questCompleted) {
    await user.save();
  }
}

// クエストシステムからフラグを更新する処理
exports.updateFlag = async (req, res, next) => {
  try {
    const { userId, updates } = req.body;
    if (!userId || !Array.isArray(updates) || updates.length === 0) {
      const error = new Error('Invalid request. userId and updates array are required.');
      error.statusCode = 400;
      throw error;
    }

    const updateOperation = { $inc: {} };
    let shouldIncrementGamesPlayed = false; // ★ games_playedを増やすかどうかのフラグ

    // ★ games_playedをトリガーするフラグのリストを定義
    const playedFlags = ['casino_played', 'dungeon_played', 'code_editor_played'];

    for (const update of updates) {
      if (typeof update.flagName === 'string' && typeof update.increment === 'number') {
        // 全てのリクエストされたフラグを更新対象に追加
        updateOperation.$inc[`flags.${update.flagName}`] = update.increment;

        // ★ 新しい'common'ルールの判定
        //    更新対象に*_playedフラグが含まれていたら、フラグを立てる
        if (playedFlags.includes(update.flagName) && update.increment > 0) {
          shouldIncrementGamesPlayed = true;
        }

        // カジノで稼いだ分のお金をcurrencyにも反映させる
        if (update.flagName === 'casino_coins_earned') {
          updateOperation.$inc['currency'] = update.increment;
        }
      }
    }

    // ★ 'common'ルールを適用
    //    *_playedフラグが更新されていた場合、games_playedを1だけ増やす
    if (shouldIncrementGamesPlayed) {
      updateOperation.$inc['flags.games_played'] = 1;
    }

    if (Object.keys(updateOperation.$inc).length === 0) {
      const error = new Error('Invalid updates format.');
      error.statusCode = 400;
      throw error;
    }

    // 1. フラグを更新
    let updatedUser = await User.findOneAndUpdate({ id: userId }, updateOperation, { new: true });
    if (!updatedUser) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. クエスト達成をチェック
    await checkAndProcessQuestCompletion(updatedUser);

    const finalUser = await User.findOne({ id: userId });


    res.status(200).json({
      status: 'success',
      data: { 
        message: 'Flags Updated Successfully',
        updatedUser: finalUser
      } // updatedUser
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

exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findOne({ id: req.params.id });

    if (!user) {
      // ユーザーが見つからない場合は、まだ有効化されていないのと同じ
      return res.status(200).json({ status: 'success', data: { isActivated: false } });
    }

    res.status(200).json({
      status: 'success',
      data: {
        isActivated: user.isActivated
      }
    });

  } catch (error) {
    next(error);
  }
};