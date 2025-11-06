// utils/questGenerator.js

// ----- クエスト定義リスト -----
const QUEST_DEFINITIONS = {
  casino: [
    { id: 'casino_roulette_played', text: 'ルーレットをN回遊ぶ', baseUnit: 1, difficulty: 1, targetFlag: 'casino_roulette_played' },
    { id: 'casino_poker_played', text: 'ポーカーをN回遊ぶ', baseUnit: 1, difficulty: 1, targetFlag: 'casino_poker_played' },
    { id: 'casino_blackjack_played', text: 'ブラックジャックをN回遊ぶ', baseUnit: 1, difficulty: 1, targetFlag: 'casino_blackjack_played' },
    { id: 'casino_coins_earned', text: 'コインをN枚稼ぐ', baseUnit: 100, difficulty: 4, targetFlag: 'casino_coins_earned' },
  ],
  dungeon: [
    { id: 'dungeon_enemies_defeated', text: '敵をN体倒す', baseUnit: 1, difficulty: 3, targetFlag: 'dungeon_enemies_defeated' },
    { id: 'dungeon_floors_cleared', text: '階層をN回突破する', baseUnit: 1, difficulty: 3, targetFlag: 'dungeon_floors_cleared' },
  ],
  code_editor: [
    { id: 'code_problems_solved', text: '問題をN個解く', baseUnit: 1, difficulty: 2, targetFlag: 'code_problems_solved' },
    { id: 'code_solo_clears', text: '1人でN回クリアする', baseUnit: 1, difficulty: 5, targetFlag: 'code_solo_clears' },
    // 「N回以下の失敗でクリア」は達成条件の判定が複雑なため、一旦なし。実装するには違う専用のロジックが必要
  ]
};

/**
 * 指定されたカテゴリの新しいランダムなクエストを生成する
 * @param {string} category - 'casino', 'dungeon', 'code_editor'
 * @param {object} currentUserFlags - ユーザーの現在のフラグオブジェクト
 * @returns {object} 生成された新しいクエストオブジェクト
 */
exports.generateNewQuest = (category, currentUserFlags) => {
  const definitions = QUEST_DEFINITIONS[category];
  if (!definitions) return null;

  // ランダムにクエストの原型を選ぶ
  const baseQuest = definitions[Math.floor(Math.random() * definitions.length)];

  // 難易度をスケーリングする
  let multiplier = 1;
  if (baseQuest.difficulty < 5) {
    multiplier = Math.floor(Math.random() * 3) + 1; // 1, 2, 3のどれか
  }
  const finalDifficulty = baseQuest.difficulty * multiplier;
  const targetN = baseQuest.baseUnit * multiplier;

  // クエストの詳細を決定
  const targetFlag = baseQuest.targetFlag;
  const startValue = currentUserFlags[targetFlag] || 0; // クエスト開始時点のフラグ値
  const targetValue = startValue + targetN; // 目標は「現在の値 + N」

  // 報酬を計算、とりあえず難易度にかけておく
  const rewardCurrency = 10 * finalDifficulty;
  const rewardExperience = 20 * finalDifficulty;

  // 返却するクエストオブジェクトを組み立てる
  return {
    questId: baseQuest.id,
    description: baseQuest.text.replace('N', targetN),
    targetFlag: targetFlag,
    targetValue: targetValue,
    startValue: startValue,
    rewardCurrency: rewardCurrency,
    rewardExperience: rewardExperience,
    difficulty: finalDifficulty,
  };
};