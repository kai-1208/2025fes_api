// controllers/userController.js
const User = require('../models/User');
const Quest = require('../models/Quest'); 

// ログイン中のユーザー情報を取得する処理
exports.getMe = async (req, res, next) => {
  try {
    // authMiddlewareによってreq.user.idがセットされている
    const user = await User.findOne({ id: req.user.id }).lean();
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    // ユーザーの現在のクエストレベルからクエストの定義を検索
    const questQueries = Object.keys(user.questLevels)
      .filter(category => user.questLevels[category] <= 5)
      .map(category => ({
        category: category,
        level: user.questLevels[category]
      }));
    
    let activeQuestsArray = [];
    if (questQueries.length > 0) {
      activeQuestsArray = await Quest.find({ $or: questQueries }).lean();
    }
    
    const activeQuests = activeQuestsArray.reduce((acc, quest) => {
      acc[quest.category] = quest;
      return acc;
    }, {});

    // ユーザー情報とクエスト情報を一緒に返す
    res.status(200).json({
      status: 'success',
      data: {
        user: user,
        activeQuests: activeQuests 
      }
    });
  } catch (error) {
    // エラーを中央エラーハンドラに渡す
    next(error);
  }
};

/**
 * クエスト達成をチェックし、達成していればレベルアップと報酬付与を行う関数
 * @param {Document} user - チェック対象のユーザーオブジェクト
 * @returns {Promise<boolean>} レベルアップが発生したかどうか
 */
async function checkAndProcessQuestCompletion(user) {
  let levelUpOccurred = false;
  
  // ユーザーが挑戦中の各カテゴリのクエストをチェック
  for (const category of Object.keys(user.questLevels)) {
    const currentLevel = user.questLevels[category];
    if (currentLevel > 5) continue; // 既に全クリ

    // 現在のレベルのクエスト定義をDBから取得
    const quest = await Quest.findOne({ category: category, level: currentLevel });
    if (!quest) continue; // クエスト定義がない場合はスキップ

    // ユーザーのフラグが目標値に達しているかチェック
    const userFlagValue = user.flags[quest.targetFlag] || 0;
    if (userFlagValue >= quest.targetValue) {
      user.questLevels[category] += 1; // レベルアップ
      user.currency += quest.rewardCurrency; // 報酬を加算
      user.experience += quest.rewardExperience;
      levelUpOccurred = true;
      console.log(`User ${user.id} cleared ${category} Lv.${currentLevel}!`);
    }
  }

  if (levelUpOccurred) {
    await user.save(); // 変更をDBに保存
  }
  return levelUpOccurred;
}

// クエストシステムからフラグを更新する処理
exports.updateFlag = async (req, res, next) => {
  try {
    const { userId, updates } = req.body;
    if (!userId || !Array.isArray(updates) || updates.length === 0) {
      const error = new Error('Invalid request. userId and updates array are required.');
      error.statusCode = 400; throw error;
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
      }
    }

    // ★ 'common'ルールを適用
    //    *_playedフラグが更新されていた場合、games_playedを1だけ増やす
    if (shouldIncrementGamesPlayed) {
      updateOperation.$inc['flags.games_played'] = 1;
    }

    if (Object.keys(updateOperation.$inc).length === 0) {
      const error = new Error('Invalid updates format.');
      error.statusCode = 400; throw error;
    }

    // 1. フラグを更新
    let updatedUser = await User.findOneAndUpdate({ id: userId }, updateOperation, { new: true });
    if (!updatedUser) {
      const error = new Error('User not found.');
      error.statusCode = 404; throw error;
    }

    // 2. クエスト達成をチェック
    await checkAndProcessQuestCompletion(updatedUser);

    res.status(200).json({
      status: 'success',
      data: { 
        message: 'Flags updated successfully.',
        updatedUser: updatedUser.flags
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