// controllers/adminController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 新規ユーザーに設定する初期フラグの定義
const initialFlags = {
  // Common
  games_played: 0,
  // Casino
  casino_roulette_played: 0,
  casino_poker_played: 0,
  casino_blackjack_played: 0,
  casino_coins_earned: 0,
  casino_losses: 0,
  // Dungeon
  dungeon_enemies_defeated: 0,
  dungeon_chests_opened: 0,
  dungeon_player_deaths: 0,
  dungeon_floors_cleared: 0,
  // Code Editor
  code_problems_solved: 0,
  code_failures: 0,
  code_solo_clears: 0
};

// ランダムな英数字の文字列を生成するヘルパー関数
const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

exports.createUsers = async (req, res, next) => {
  try {
    const { count } = req.body;

    if (!count || !Number.isInteger(count) || count <= 0 || count > 500) {
      const error = new Error('Invalid count. Must be an integer between 1 and 500.');
      error.statusCode = 400;
      throw error;
    }

    const newUsers = [];
    const plainTextCredentials = [];

    for (let i = 0; i < count; i++) {
      const plainPass = generateRandomString(8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPass, salt);
      const userId = generateRandomString(6);

      newUsers.push({
        id: userId,
        pass: hashedPassword,
        name: `冒険者-${i + 1}`,
        currency: 100,
        experience: 0,
        flags: { ...initialFlags }
      });
      
      plainTextCredentials.push({ id: userId, pass: plainPass });
    }

    // insertManyは重複IDがあると全件失敗する可能性があるため、エラーハンドリングが重要
    await User.insertMany(newUsers, { ordered: false });

    // 成功レスポンスを統一
    res.status(201).json({
      status: 'success',
      data: {
        message: `${count} users created successfully.`,
        users: plainTextCredentials
      }
    });

  } catch (error) {
    // ID重複エラーの場合、より分かりやすいメッセージを返す
    if (error.code === 11000) {
      error.message = 'Failed to create users due to duplicate IDs. Please try again.';
      error.statusCode = 409; // 409 Conflict
    }
    // エラーを中央エラーハンドラに渡す
    next(error);
  }
};