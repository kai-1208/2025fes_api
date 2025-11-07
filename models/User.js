// models/User.js
const mongoose = require('mongoose');

// クエストの状態を保存
const activeQuestSchema = new mongoose.Schema({
  questId: { type: String, required: true }, // 'dungeon_enemies_defeated'など
  description: { type: String, required: true }, // 「敵を5体倒す」などの生成されたテキスト
  targetFlag: { type: String, required: true },
  targetValue: { type: Number, required: true },
  startValue: { type: Number, required: true }, // クエスト開始時のフラグの値
  rewardCurrency: { type: Number, required: true },
  rewardExperience: { type: Number, required: true },
  difficulty: { type: Number, required: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  id2: { type: String, required: true }, // お名前を pass -> id2 に変更
  name: { type: String, required: true },
  currency: { type: Number, default: 0 },
  experience: { type: Number, default: 0 },
  flags: { type: Object, default: {} },
  activeQuests: {
    casino: { type: activeQuestSchema, default: null },
    dungeon: { type: activeQuestSchema, default: null },
    code_editor: { type: activeQuestSchema, default: null },
  },
});

module.exports = mongoose.model('User', userSchema);