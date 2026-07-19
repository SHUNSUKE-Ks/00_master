// arena.mjs — 固定ロジック(貪欲AI)同士の自己対戦アリーナ v0.2（ベースライン=AI学習の"前"の基準線）
// 契約: gameState.js は createBattleState(overrides) 拡張のみ利用。Three.js非依存＝ブラウザ不要でNode単体で回る。
// 出力: コンソールにCMD風のログを流す＋ logs/run_<timestamp>.jsonl にコマンド列+ユニットスナップショットを保存（viewer.html再生用）。
//
// このAIは「固定ロジック」= 学習しない基準線。強くする必要はなく、
//   後で作るGambit/LLMが「これに何%勝てるか」を測る"ものさし"になるのが役目。
//
// 使い方:  node arena.mjs                 (1戦, 3v3, 固定ロジックのみ)
//          node arena.mjs 20              (20戦まとめて統計)
//          node arena.mjs gambit          (1戦, Gambitルール混成デモ)
//          node arena.mjs gambit 20       (20戦まとめて統計, Gambit混成)

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  createBattleState, applyCommand, computeReachable, hasActed,
} from "../threejs/battle-proto/src/gameState.js";
import { evaluateGambitTurn } from "./gambitEngine.mjs";
import { GAMBIT_CATALOG } from "./gambitCatalog.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const living = (state, team) => state.units.filter((u) => u.hp > 0 && u.team === team);
const nearestFoe = (state, u) => {
  const foes = living(state, u.team === "ally" ? "enemy" : "ally");
  let best = null, bd = Infinity;
  for (const f of foes) { const d = manhattan(u, f); if (d < bd) { bd = d; best = f; } }
  return best;
};

// ── 3v3ロースター(暫定・正はCSV) ────────────────────────────────────
// 既存2ユニット(drake/golem)を基準に、各チームへレンジ役(range2,低def)と
// 軽量役(move4,低hp)を1体ずつ追加した左右対称構成(x'=4-x, y'=5-y でallyとenemyが鏡像)。
const ROSTER_3V3 = [
  { id: "ally_drake", assetId: "unit_test_capsule_001", displayName: "テストドレイク", team: "ally", x: 1, y: 4, hp: 28, maxHp: 28, atk: 10, def: 6, move: 3, range: 1, movementType: "ground", moved: false, attacked: false, waited: false, facingYaw: Math.PI },
  { id: "ally_ranger", assetId: "unit_test_capsule_001", displayName: "テストレンジャー", team: "ally", x: 3, y: 4, hp: 20, maxHp: 20, atk: 9, def: 4, move: 2, range: 2, movementType: "ground", moved: false, attacked: false, waited: false, facingYaw: Math.PI },
  { id: "ally_scout", assetId: "unit_test_capsule_001", displayName: "テストスカウト", team: "ally", x: 1, y: 5, hp: 16, maxHp: 16, atk: 8, def: 3, move: 4, range: 1, movementType: "ground", moved: false, attacked: false, waited: false, facingYaw: Math.PI },
  { id: "enemy_golem", assetId: "unit_test_capsule_003", displayName: "テストゴーレム", team: "enemy", x: 3, y: 1, hp: 58, maxHp: 58, atk: 14, def: 22, move: 2, range: 1, movementType: "heavy_ground", moved: false, attacked: false, waited: false, facingYaw: 0 },
  { id: "enemy_sniper", assetId: "unit_test_capsule_003", displayName: "テストスナイパー", team: "enemy", x: 1, y: 1, hp: 20, maxHp: 20, atk: 9, def: 4, move: 2, range: 2, movementType: "ground", moved: false, attacked: false, waited: false, facingYaw: 0 },
  { id: "enemy_skirmisher", assetId: "unit_test_capsule_003", displayName: "テスト遊撃兵", team: "enemy", x: 3, y: 0, hp: 16, maxHp: 16, atk: 8, def: 3, move: 4, range: 1, movementType: "ground", moved: false, attacked: false, waited: false, facingYaw: 0 },
];

// 同じ3v3配置にGambitDB.csvの6種すべてを1体ずつ割り当てたデモ用ロースター。
// 「ものさし」検証用: 固定ロジック(ROSTER_3V3)と同じ初期配置・ステータスのまま、
// gambitSetIdだけ付与して行動決定をルールベースに差し替えている（数値は変更していない）。
const ROSTER_3V3_GAMBIT_DEMO = ROSTER_3V3.map((u) => ({ ...u, gambitSetId: {
  ally_drake: "gambit_boss_phase_v1",   // 最大HP=フェーズ推移を観測しやすい
  ally_ranger: "gambit_flanker_v1",
  ally_scout: "gambit_cautious_v1",     // 低HP/低DFで「様子見」の効果が出やすい
  enemy_golem: "gambit_guardian_v1",    // 高DFの前衛=守り抜く役
  enemy_sniper: "gambit_sniper_v1",     // 名前通り
  enemy_skirmisher: "gambit_aggressive_v1", // 機動力(move4)を活かした突撃役
}[u.id] }));

// ── 固定ロジック本体（ベースライン=AI学習の"前"の基準線） ─────────────
// 「最寄りの敵へ、移動範囲内で一番近づけるマスへ寄り、射程内なら殴る」。
// enemyTurnの簡易AIと同じ思想だが move値ぶんフルに寄る点だけ強化（1v1/多対多で膠着しないため）。
// 完全に決定的（乱数なし）＝同じ初期状態なら毎回まったく同じ棋譜になる＝再現性は構造的に保証。
function decideTurnBaseline(state, unitId) {
  const u = state.units.find((x) => x.id === unitId && x.hp > 0);
  const cmds = [];
  if (!u) return cmds;
  const target = nearestFoe(state, u);
  if (!target) { cmds.push({ type: "faceWait", unitId: u.id, yaw: u.facingYaw }); return cmds; }

  // 到達可能マスのうち、targetへのマンハッタン距離が最小のマスを選ぶ（同点は移動コスト小を優先）。
  const reach = [...computeReachable(state, u.id).values()];
  let best = { x: u.x, y: u.y, dist: 0 }, bestScore = Infinity, bestStep = Infinity;
  for (const r of reach) {
    const s = manhattan(r, target);
    if (s < bestScore || (s === bestScore && r.dist < bestStep)) { bestScore = s; bestStep = r.dist; best = r; }
  }
  if (best.x !== u.x || best.y !== u.y) cmds.push({ type: "move", unitId: u.id, to: { x: best.x, y: best.y } });

  // 移動後の位置から射程内なら攻撃、届かなければ向きを敵へ向けて待機。
  if (manhattan(best, target) <= u.range) {
    cmds.push({ type: "attack", unitId: u.id, targetId: target.id });
  } else {
    const dx = target.x - best.x, dy = target.y - best.y;
    cmds.push({ type: "faceWait", unitId: u.id, yaw: Math.atan2(dx, dy) });
  }
  return cmds;
}

// gambitSetIdが付与されたユニットはGambit評価エンジンへ、それ以外は従来の固定ロジックへ委譲する。
// gambitMemory: F1膠着打開用の対戦単位メモリ(Map)。エンジンへ渡すと連続無為ターンで攻勢化する。
function decideTurn(state, unitId, gambitMemory) {
  const u = state.units.find((x) => x.id === unitId && x.hp > 0);
  if (u?.gambitSetId && GAMBIT_CATALOG[u.gambitSetId]) return evaluateGambitTurn(state, unitId, GAMBIT_CATALOG[u.gambitSetId], gambitMemory);
  return decideTurnBaseline(state, unitId);
}

// コマンド適用後の全ユニットスナップショット（viewer.htmlはこれだけを見て描画し、ルール知識を持たない）
function snapshotUnits(state) {
  return state.units.map((u) => ({
    id: u.id, team: u.team, name: u.displayName,
    hp: u.hp, maxHp: u.maxHp, atk: u.atk, def: u.def,
    x: u.x, y: u.y, acted: hasActed(u),
  }));
}

// ── 1戦を回す ─────────────────────────────────────────────────────
function playOne(roster, { verbose = true } = {}) {
  const state = createBattleState({ units: roster.map((u) => ({ ...u })) });
  const gambitMemory = new Map(); // F1: この対戦だけのGambit膠着打開メモリ(対戦ごとに新規=決定性維持)
  const jsonl = []; // {tick, cmd, events, units} を1行ずつ
  const dispatch = (cmd) => {
    const events = applyCommand(state, cmd);
    jsonl.push({ tick: state.tick, cmd, events, units: snapshotUnits(state) });
    if (verbose) for (const e of events) if (e.type === "log") console.log(`  ${e.text}`);
    return events;
  };

  dispatch({ type: "startBattle" });

  let guard = 0;
  while (state.phase === "playing" && guard++ < 400) {
    const team = state.turn;
    if (verbose) console.log(`\n[T${guard}] === ${team === "ally" ? "1P(ally)" : "2P(enemy)"} のターン ===`);
    // このターンに動くチームの生存ユニットを順に処理
    for (const u of living(state, team)) {
      if (state.phase !== "playing") break;
      for (const cmd of decideTurn(state, u.id, gambitMemory)) {
        dispatch(cmd);
        if (state.phase !== "playing") break;
      }
    }
    if (state.phase === "playing") dispatch({ type: "endTurn" });
  }

  const winner = state.phase === "victory" ? "ally" : state.phase === "defeat" ? "enemy" : "draw";
  const survivors = state.units.filter((u) => u.hp > 0).map((u) => `${u.displayName}(HP${u.hp}/${u.maxHp})`);
  return { winner, turns: guard, tick: state.tick, survivors, jsonl };
}

// ── エントリ ──────────────────────────────────────────────────────
const useGambit = process.argv[2] === "gambit";
const nArg = process.argv[useGambit ? 3 : 2];
const N = Math.max(1, parseInt(nArg ?? "1", 10) || 1);
const roster = useGambit ? ROSTER_3V3_GAMBIT_DEMO : ROSTER_3V3;
const modeLabel = useGambit ? "Gambitルール混成 (Step2評価エンジン)" : "固定ロジックのみ";

if (N === 1) {
  console.log(`══════════ 自己対戦アリーナ v0.2 (1戦, 3v3, ${modeLabel}) ══════════`);
  if (useGambit) {
    console.log("gambitSetId割当:");
    for (const u of roster) console.log(`  ${u.displayName}(${u.team}): ${u.gambitSetId}`);
  } else {
    console.log("policy: greedy(最寄りの敵へ寄って射程内なら攻撃) / 決定的・乱数なし");
  }
  console.log("");
  const r = playOne(roster, { verbose: true });
  console.log(`\n══════════ 決着 ══════════`);
  console.log(`勝者: ${r.winner === "ally" ? "1P(ally)" : r.winner === "enemy" ? "2P(enemy)" : "引き分け(打ち切り)"}`);
  console.log(`ターン数: ${r.turns} / 総tick: ${r.tick}`);
  console.log(`生存: ${r.survivors.join(", ") || "なし"}`);

  const logDir = join(__dir, "logs");
  mkdirSync(logDir, { recursive: true });
  const prefix = useGambit ? "gambit" : "baseline";
  const file = join(logDir, `run_${prefix}_${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);
  writeFileSync(file, r.jsonl.map((x) => JSON.stringify(x)).join("\n") + "\n");
  console.log(`\n棋譜(JSONL)を保存: ${file}`);
  console.log(`  → 同じseedなし・決定的なので再実行すれば必ず同じ結果。viewer.htmlにドラッグ&ドロップで再生できる。`);
} else {
  console.log(`══════════ 自己対戦 ${N}戦の統計 (3v3, ${modeLabel}) ══════════`);
  const tally = { ally: 0, enemy: 0, draw: 0 };
  let turnSum = 0;
  for (let i = 0; i < N; i++) { const r = playOne(roster, { verbose: false }); tally[r.winner]++; turnSum += r.turns; }
  console.log(`1P(ally)勝: ${tally.ally}  2P(enemy)勝: ${tally.enemy}  引分: ${tally.draw}`);
  console.log(`平均ターン数: ${(turnSum / N).toFixed(1)}`);
  console.log(`※現状は初期状態が固定＝決定的なので全戦同一結果。ユニット構成に乱数を入れると意味を持つ。`);
}
