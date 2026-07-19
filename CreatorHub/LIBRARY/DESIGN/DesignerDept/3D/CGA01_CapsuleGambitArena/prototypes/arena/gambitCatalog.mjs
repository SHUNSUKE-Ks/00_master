// gambitCatalog.mjs — GambitDB.csv(6種)の日本語説明を、
// GAME/BattleEngine/GambitSystem/schemas/gambit.rule.schema.json 準拠のルールへ具体化したもの。
// 出典: brief/notion_import/GambitDB.csv（2026-07-19時点）。数値・閾値は暫定でバランス調整はしない。
//
// 読み方: priorityが高い順に評価し、whenを満たす最初の1件のthenが実行される(gambitEngine.mjs)。

export const GAMBIT_CATALOG = {
  // 猛攻: 積極的に前進し最も近い敵へ突撃する（=既存の固定ロジックそのものと等価）
  gambit_aggressive_v1: [
    { ruleId: "aggr_attack", label: "近い敵を攻撃", priority: 90, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "attack", targetPolicy: "nearest_enemy" } },
    { ruleId: "aggr_approach", label: "敵に突撃", priority: 20, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "moveTo", movePolicy: "approach", targetPolicy: "nearest_enemy" } },
  ],

  // 守り抜く: 前線に留まり味方や陣地を守る（自分から追撃せず、来た敵だけ迎え撃つ）
  gambit_guardian_v1: [
    { ruleId: "guard_attack", label: "射程内の敵を迎撃", priority: 90, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "attack", targetPolicy: "nearest_enemy" } },
    { ruleId: "guard_hold", label: "持ち場を維持", priority: 10, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "moveTo", movePolicy: "hold_position", targetPolicy: "nearest_enemy" } },
  ],

  // 狙撃: 射程を活かし後方から一方的に攻撃する（射程を保ったまま距離を離す）
  gambit_sniper_v1: [
    { ruleId: "snipe_kite", label: "距離を保ちつつ射程内を維持", priority: 80, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "moveTo", movePolicy: "keep_distance", targetPolicy: "nearest_enemy" } },
    { ruleId: "snipe_attack", label: "射程内から攻撃", priority: 70, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "attack", targetPolicy: "nearest_enemy" } },
  ],

  // 慎重: 不利な間合いでは様子見し安全に立ち回る（自HP低下時は交戦せず後退）
  gambit_cautious_v1: [
    { ruleId: "caut_guard_low", label: "HP低下時は守りに徹する", priority: 98, owner: "enemy",
      when: { target: "self", hpPercentLessThan: 35 },
      then: { action: "guard" } },
    { ruleId: "caut_retreat_low", label: "HP低下時は後退", priority: 95, owner: "enemy",
      when: { target: "self", hpPercentLessThan: 35 },
      then: { action: "retreat", targetPolicy: "nearest_enemy" } },
    { ruleId: "caut_attack", label: "通常時は攻撃", priority: 60, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "attack", targetPolicy: "nearest_enemy" } },
    { ruleId: "caut_approach", label: "通常時は接近", priority: 20, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "moveTo", movePolicy: "approach", targetPolicy: "nearest_enemy" } },
  ],

  // 側面突き: 側面や背後に回り込んでから攻撃を狙う
  gambit_flanker_v1: [
    { ruleId: "flank_approach", label: "側面/背後へ回り込む", priority: 80, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "moveTo", movePolicy: "approach", targetPolicy: "nearest_enemy" } },
    { ruleId: "flank_attack", label: "回り込んでから攻撃", priority: 70, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "attack", targetPolicy: "nearest_enemy" } },
  ],

  // ボスフェーズ: HP割合に応じて行動パターンが変化する
  // 健在期(>=66%)=通常攻勢 / 中期(33-66%)=守りに転じる(様子見) / 瀕死期(<33%)=総攻撃(enrage)
  gambit_boss_phase_v1: [
    { ruleId: "boss_enrage_attack", label: "瀕死: 総攻撃", priority: 95, owner: "enemy",
      when: { target: "self", hpPercentLessThan: 33 },
      then: { action: "attack", targetPolicy: "nearest_enemy" } },
    { ruleId: "boss_enrage_approach", label: "瀕死: 突撃", priority: 90, owner: "enemy",
      when: { target: "self", hpPercentLessThan: 33 },
      then: { action: "moveTo", movePolicy: "approach", targetPolicy: "nearest_enemy" } },
    { ruleId: "boss_mid_guard", label: "中期: 様子見", priority: 60, owner: "enemy",
      when: { target: "self", hpPercentLessThan: 66 },
      then: { action: "guard" } },
    { ruleId: "boss_normal_attack", label: "健在: 通常攻撃", priority: 20, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "attack", targetPolicy: "nearest_enemy" } },
    { ruleId: "boss_normal_approach", label: "健在: 通常接近", priority: 10, owner: "enemy",
      when: { target: "nearest_enemy" },
      then: { action: "moveTo", movePolicy: "approach", targetPolicy: "nearest_enemy" } },
  ],
};
