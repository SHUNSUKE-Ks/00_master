// gambit.test.mjs — Gambitエンジン/カタログの自動テスト。フレームワーク不使用(プロジェクト方針)。
// 実行:  node gambit.test.mjs   (全pass時 exit 0 / 1件でもfailで exit 1)
// カバー範囲:
//   - 後方互換(無引数createBattleState)
//   - 6種ガンビットの行動差別化(HP依存スイッチは対照ケース付き)
//   - F1 膠着打開(連続無為ターンで攻勢化ラッチ)＋ guardian×cautious がフル対戦で決着すること
//   - F2 boss中期(33-66%)がその場保持=接近しない(距離3/HP53%)
//   - F3 flanker側面成立が移動力依存(move十分→側面 / move不足→通常approードにフォールバック)

import { createBattleState, applyCommand } from "../threejs/battle-proto/src/gameState.js";
import { evaluateGambitTurn } from "./gambitEngine.mjs";
import { GAMBIT_CATALOG } from "./gambitCatalog.mjs";

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log("  ✓", name); }
  else { fail++; console.log("  ✗ FAIL:", name, extra); }
};
const man = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const A = (o) => ({ assetId: "x", displayName: "A", team: "ally", hp: 20, maxHp: 20, atk: 9, def: 4, move: 2, range: 1, movementType: "ground", moved: false, attacked: false, waited: false, facingYaw: 0, ...o });
const E = (o) => ({ assetId: "x", displayName: "E", team: "enemy", hp: 20, maxHp: 20, atk: 9, def: 4, move: 2, range: 1, movementType: "ground", moved: false, attacked: false, waited: false, facingYaw: 0, ...o });
function scenario(actor, enemy) {
  const s = createBattleState({ units: [actor, enemy] });
  s.phase = "playing"; s.turn = actor.team;
  return s;
}
const rules = (id) => GAMBIT_CATALOG[id];
const moveOf = (cmds) => cmds.find((c) => c.type === "move");
const endOf = (cmds) => cmds.find((c) => c.type === "attack" || c.type === "faceWait");

// ── 後方互換 ──────────────────────────────────────────────────────
console.log("[後方互換] createBattleState");
{
  const s0 = createBattleState();
  check("無引数=元の2ユニット", s0.units.length === 2 && s0.units[0].id === "ally_drake" && s0.units[1].id === "enemy_golem");
  check("drake 28/10/6/3/1", s0.units[0].hp === 28 && s0.units[0].atk === 10 && s0.units[0].def === 6 && s0.units[0].move === 3 && s0.units[0].range === 1);
  createBattleState({ units: [A({ id: "z" })] });
  check("override後も既定が汚染されない", createBattleState().units.length === 2);
}

// ── 6種の行動差別化 ───────────────────────────────────────────────
console.log("[差別化] guardian");
{
  const s = scenario(A({ id: "g", x: 2, y: 4, gambitSetId: "gambit_guardian_v1" }), E({ id: "e", x: 2, y: 0 }));
  const c = evaluateGambitTurn(s, "g", rules("gambit_guardian_v1"));
  check("射程外の敵を追わない(移動なし)", !moveOf(c));
  check("攻撃せずfaceWait", endOf(c)?.type === "faceWait");
}
console.log("[差別化] sniper(range2)");
{
  const s = scenario(A({ id: "sn", x: 2, y: 4, range: 2, gambitSetId: "gambit_sniper_v1" }), E({ id: "e", x: 2, y: 3 }));
  const c = evaluateGambitTurn(s, "sn", rules("gambit_sniper_v1"));
  const mv = moveOf(c); const after = mv ? mv.to : { x: 2, y: 4 };
  check("間合いを1→2に取り直す", mv && man(after, { x: 2, y: 3 }) > 1);
  check("射程内から攻撃", endOf(c)?.type === "attack" && man(after, { x: 2, y: 3 }) <= 2);
}
console.log("[差別化] cautious");
{
  const sLow = scenario(A({ id: "c", x: 2, y: 4, hp: 5, maxHp: 16, gambitSetId: "gambit_cautious_v1" }), E({ id: "e", x: 2, y: 3 }));
  const cLow = evaluateGambitTurn(sLow, "c", rules("gambit_cautious_v1"));
  check("HP<35%で後退(距離拡大)", moveOf(cLow) && man(moveOf(cLow).to, { x: 2, y: 3 }) > 1);
  check("HP<35%で攻撃しない", endOf(cLow)?.type === "faceWait");
  const sOk = scenario(A({ id: "c2", x: 2, y: 4, hp: 16, maxHp: 16, gambitSetId: "gambit_cautious_v1" }), E({ id: "e", x: 2, y: 3 }));
  check("HP健全は攻撃(対照)", endOf(evaluateGambitTurn(sOk, "c2", rules("gambit_cautious_v1")))?.type === "attack");
}
console.log("[差別化] aggressive");
{
  const s = scenario(A({ id: "ag", x: 2, y: 4, gambitSetId: "gambit_aggressive_v1" }), E({ id: "e", x: 2, y: 1 }));
  const mv = moveOf(evaluateGambitTurn(s, "ag", rules("gambit_aggressive_v1")));
  check("敵へ接近(距離短縮)", mv && man(mv.to, { x: 2, y: 1 }) < 3);
}

// ── F2: boss中期はその場保持=接近しない ────────────────────────────
console.log("[F2] boss_phase");
{
  // 中期(53%)・敵距離3 → 移動を出さない(hold) かつ 攻撃しない(様子見)
  const sMid = scenario(A({ id: "b", x: 2, y: 4, hp: 15, maxHp: 28, gambitSetId: "gambit_boss_phase_v1" }), E({ id: "e", x: 2, y: 1 }));
  const cMid = evaluateGambitTurn(sMid, "b", rules("gambit_boss_phase_v1"));
  check("中期(HP53%,距離3): 接近移動を出さない(hold)", !moveOf(cMid), JSON.stringify(cMid));
  check("中期: 攻撃せずfaceWait", endOf(cMid)?.type === "faceWait");
  // 対照: 健在(>66%)は接近する / 瀕死(<33%)は隣接敵を総攻撃
  const sHi = scenario(A({ id: "b2", x: 2, y: 4, hp: 28, maxHp: 28, gambitSetId: "gambit_boss_phase_v1" }), E({ id: "e", x: 2, y: 1 }));
  check("健在: 接近する(対照)", !!moveOf(evaluateGambitTurn(sHi, "b2", rules("gambit_boss_phase_v1"))));
  const sLo = scenario(A({ id: "b3", x: 2, y: 4, hp: 8, maxHp: 28, gambitSetId: "gambit_boss_phase_v1" }), E({ id: "e", x: 2, y: 3 }));
  check("瀕死: 隣接敵を攻撃(対照)", endOf(evaluateGambitTurn(sLo, "b3", rules("gambit_boss_phase_v1")))?.type === "attack");
}

// ── F3: flanker側面成立は移動力依存 ─────────────────────────────────
console.log("[F3] flanker 移動力依存");
{
  // 敵は南向き(facingYaw=0=face_down)。move十分なら正面(南)でなく側面へ回り込む
  const sFar = scenario(A({ id: "f", x: 2, y: 5, move: 4, gambitSetId: "gambit_flanker_v1" }), E({ id: "e", x: 2, y: 2, move: 0 }));
  const mvFar = moveOf(evaluateGambitTurn(sFar, "f", rules("gambit_flanker_v1")));
  const front = mvFar && mvFar.to.y > 2 && mvFar.to.x === 2;
  check("move十分: 側面/背面へ回り込む(正面でない)", mvFar && !front, JSON.stringify(mvFar));
  // move不足(1)で遠い → 側面まで届かず通常approachにフォールバック(=距離短縮はする)
  const sNear = scenario(A({ id: "f2", x: 2, y: 5, move: 1, gambitSetId: "gambit_flanker_v1" }), E({ id: "e", x: 2, y: 2, move: 0 }));
  const mvNear = moveOf(evaluateGambitTurn(sNear, "f2", rules("gambit_flanker_v1")));
  check("move不足: approachにフォールバック(距離を詰める)", mvNear && man(mvNear.to, { x: 2, y: 2 }) < man({ x: 2, y: 5 }, { x: 2, y: 2 }), JSON.stringify(mvNear));
}

// ── F1: 膠着打開(単体) ─────────────────────────────────────────────
console.log("[F1] 膠着打開(単体)");
{
  // guardianは射程外の敵を追わない。memory有りで連続無為ターンが続くと攻勢化(接近move)へ切替。
  // コマンドは適用せず(=ユニットは動かない)、エンジンが接近moveを出し始める回を検出する。
  const s = scenario(A({ id: "g", x: 2, y: 5, move: 2, gambitSetId: "gambit_guardian_v1" }), E({ id: "e", x: 2, y: 0, move: 0 }));
  const mem = new Map();
  let firstMoveTurn = -1;
  for (let t = 0; t < 6; t++) {
    const mv = moveOf(evaluateGambitTurn(s, "g", rules("gambit_guardian_v1"), mem));
    if (mv && man(mv.to, { x: 2, y: 0 }) < 5) { firstMoveTurn = t; break; }
  }
  check("連続無為(STALEMATE_LIMIT)後に接近を開始する", firstMoveTurn >= 0 && firstMoveTurn <= 4, "firstMoveTurn=" + firstMoveTurn);
  // memory無し=ステートレス=いつまでもhold(打開しない)＝挙動テスト互換の担保
  const s2 = scenario(A({ id: "g2", x: 2, y: 5, move: 2, gambitSetId: "gambit_guardian_v1" }), E({ id: "e", x: 2, y: 0, move: 0 }));
  let neverMoves = true;
  for (let t = 0; t < 6; t++) if (moveOf(evaluateGambitTurn(s2, "g2", rules("gambit_guardian_v1")))) neverMoves = false;
  check("memory無し=ステートレスで従来通りhold", neverMoves);
}

// ── F1: 膠着打開(フル対戦で決着) ────────────────────────────────────
// arena.mjsのgambitデモ相当(guardian×cautiousを含む6種)がもう400ターン引き分けにならず決着すること。
console.log("[F1] フル対戦で決着(400ターン引き分けの解消)");
{
  const roster = [
    A({ id: "ally_drake", x: 1, y: 4, hp: 28, maxHp: 28, atk: 10, def: 6, move: 3, range: 1, gambitSetId: "gambit_boss_phase_v1" }),
    A({ id: "ally_ranger", x: 3, y: 4, hp: 20, maxHp: 20, atk: 9, def: 4, move: 2, range: 2, gambitSetId: "gambit_flanker_v1" }),
    A({ id: "ally_scout", x: 1, y: 5, hp: 16, maxHp: 16, atk: 8, def: 3, move: 4, range: 1, gambitSetId: "gambit_cautious_v1" }),
    E({ id: "enemy_golem", x: 3, y: 1, hp: 58, maxHp: 58, atk: 14, def: 22, move: 2, range: 1, movementType: "heavy_ground", gambitSetId: "gambit_guardian_v1" }),
    E({ id: "enemy_sniper", x: 1, y: 1, hp: 20, maxHp: 20, atk: 9, def: 4, move: 2, range: 2, gambitSetId: "gambit_sniper_v1" }),
    E({ id: "enemy_skirmisher", x: 3, y: 0, hp: 16, maxHp: 16, atk: 8, def: 3, move: 4, range: 1, gambitSetId: "gambit_aggressive_v1" }),
  ];
  const s = createBattleState({ units: roster.map((u) => ({ ...u })) });
  const mem = new Map();
  const living = (team) => s.units.filter((u) => u.hp > 0 && u.team === team);
  applyCommand(s, { type: "startBattle" });
  let guardTurns = 0;
  while (s.phase === "playing" && guardTurns++ < 400) {
    for (const u of living(s.turn)) {
      if (s.phase !== "playing") break;
      for (const cmd of evaluateGambitTurn(s, u.id, GAMBIT_CATALOG[u.gambitSetId], mem)) {
        applyCommand(s, cmd);
        if (s.phase !== "playing") break;
      }
    }
    if (s.phase === "playing") applyCommand(s, { type: "endTurn" });
  }
  check("400ターン未満で決着する(引き分けでない)", s.phase !== "playing" && guardTurns < 400, "phase=" + s.phase + " turns=" + guardTurns);
}

console.log(`\n===== 結果: ${pass} pass / ${fail} fail =====`);
process.exit(fail ? 1 : 0);
