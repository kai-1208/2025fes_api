// models/Quest.js
const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
  category: { 
    type: String, 
    required: true, 
    enum: ['casino', 'dungeon', 'code_editor'] 
  },
  level: { type: Number, required: true },
  targetFlag: { type: String, required: true }, // 例: 'dungeon_enemies_defeated'
  targetValue: { type: Number, required: true }, // 例: 10
  rewardCurrency: { type: Number, default: 0 },
  rewardExperience: { type: Number, default: 0 }
});

// categoryとlevelの組み合わせでユニークにする
questSchema.index({ category: 1, level: 1 }, { unique: true });

module.exports = mongoose.model('Quest', questSchema);