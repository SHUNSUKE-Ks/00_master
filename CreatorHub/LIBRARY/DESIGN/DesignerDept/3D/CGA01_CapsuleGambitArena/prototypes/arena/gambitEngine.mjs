// gambitEngine.mjs — Gambitルール(when/then)を評価し、gameState.jsのapplyCommandが
// 受け付けるコマンドJSONへ変換する評価エンジン。ステップ2実装本体。
// スキーマ出典: GAME/BattleEngine/GambitSystem/schemas/gambit.rule.schema.json（変更なし・読取専用）
// 契約: gameState.js は一切変更しない。ここもThree.js非依存。
//
// ルールセットの意味論（FFXII型ガンビットに準拠）:
//   優先度(priority)の高い順に評価し、「when条件を満たす最初の1件」のthenだけを実行する。
//   1ユニットの1ターンは既存エンジン同様「移動フェーズ→最終行動フェーズ」の2段。
//   各フェーズで独立にルールリストを先頭から評価する(移動系ルールと終端系ルールは別集合)。
//
// スキーマ上の未実装ギャップ（意図的な仕様、拡張ポイントとしてコメントに残す）:
//   - when.statusIncludes / when.resourceAtLeast: gameStateに状態異常・リソース(MP等)の概念が
//     まだ存在しないため、これらを含むルールは常に不成立として扱う。
//   - then.action:"useSkill": gameStateにスキル概念がないため常に不成立(次点ルールへフォールスルー)。
//   - then.action:"attack" の when.distanceLessThanOrEqual 省略時は、自ユニットのrangeを
//     暗黙の距離条件として使う（スキーマ自体は変更しない、本エンジン内の解釈規約）。
//   - movePolicy:"seek_cover": 地形の遮蔽概念が未実装のため hold_position と同じ(その場に留まる)。
//   - ruleId:"flank_approach" は movePolicy:"approach" の特別扱いとして、
//     target.facingYaw の正面90°外を優先する側面アプローチを行う（flankというmovePolicyは
//     スキーマのenumに無いため、既存approach内のタイブレークとして実現。将来の拡張ポイント）。

import { computeReachable } from "../threejs/battle-proto/src/gameState.js";

const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const hpPercent = (u) => (u.maxHp ? (u.hp / u.maxHp) * 100 : 0);

// ── ターゲット解決（when.target / then.targetPolicy 共通） ──────────────
function resolveTarget(state, unit, targetType) {
  const enemies = () => state.units.filter((x) => x.hp > 0 && x.team !== unit.team);
  const alliesExceptSelf = () => state.units.filter((x) => x.hp > 0 && x.team === unit.team && x.id !== unit.id);
  const nearestOf = (list) => {
    let best = null, bd = Infinity;
    for (const f of list) { const d = manhattan(unit, f); if (d < bd) { bd = d; best = f; } }
    return best;
  };
  switch (targetType) {
    case "self": return unit;
    case "enemy":
    case "nearest_enemy": return nearestOf(enemies());
    case "ally": return nearestOf(alliesExceptSelf());
    case "lowest_hp_ally": {
      let best = null, bp = Infinity;
      for (const a of alliesExceptSelf()) { const p = hpPercent(a); if (p < bp) { bp = p; best = a; } }
      return best;
    }
    case "highest_threat_enemy": {
      let best = null, bt = -Infinity;
      for (const f of enemies()) { if (f.atk > bt) { bt = f.atk; best = f; } }
      return best;
    }
    default: return null;
  }
}

// when句が(条件対象=conditionTarget に対して)成立するか
function whenMatches(fromPos, conditionTarget, when, actionType, selfUnit) {
  if (!when) return true;
  if (when.target && !conditionTarget) return false;
  if (Number.isFinite(when.hpPercentLessThan) && !(conditionTarget && hpPercent(conditionTarget) < when.hpPercentLessThan)) return false;
  if (Number.isFinite(when.hpPercentGreaterThan) && !(conditionTarget && hpPercent(conditionTarget) > when.hpPercentGreaterThan)) return false;
  if (Number.isFinite(when.distanceLessThanOrEqual)) {
    if (!conditionTarget || !(manhattan(fromPos, conditionTarget) <= when.distanceLessThanOrEqual)) return false;
  } else if (actionType === "attack") {
    if (!conditionTarget || !(manhattan(fromPos, conditionTarget) <= selfUnit.range)) return false;
  }
  if (when.statusIncludes || when.resourceAtLeast) return false; // 未実装系は常に不成立
  return true;
}

// ── 移動先計算 ───────────────────────────────────────────────────
function bestApproachTile(state, u, target) {
  const reach = [...computeReachable(state, u.id).values()];
  let best = { x: u.x, y: u.y, dist: 0 }, bestScore = Infinity, bestStep = Infinity;
  for (const r of reach) {
    const s = manhattan(r, target);
    if (s < bestScore || (s === bestScore && r.dist < bestStep)) { bestScore = s; bestStep = r.dist; best = r; }
  }
  return best;
}

function bestKeepDistanceTile(state, u, target) {
  // 自分のrange以内に収まる到達可能マスのうち、targetから最も遠い(安全な)マスを選ぶ。
  // 該当なし(rangeに届く場所へまだ移動できていない)ならapproachにフォールバック。
  const reach = [...computeReachable(state, u.id).values()];
  const inRange = reach.filter((r) => manhattan(r, target) <= u.range);
  if (inRange.length === 0) return bestApproachTile(state, u, target);
  let best = inRange[0], bestDist = -1, bestStep = Infinity;
  for (const r of inRange) {
    const d = manhattan(r, target);
    if (d > bestDist || (d === bestDist && r.dist < bestStep)) { bestDist = d; bestStep = r.dist; best = r; }
  }
  return best;
}

function bestRetreatTile(state, u, target) {
  // rangeは考慮せず、targetから最も遠い到達可能マスへ純粋に離脱する
  const reach = [...computeReachable(state, u.id).values()];
  let best = { x: u.x, y: u.y, dist: 0 }, bestDist = -Infinity, bestStep = Infinity;
  for (const r of reach) {
    const d = manhattan(r, target);
    if (d > bestDist || (d === bestDist && r.dist < bestStep)) { bestDist = d; bestStep = r.dist; best = r; }
  }
  return best;
}

function bestFlankApproachTile(state, u, target) {
  // targetの正面(facingYaw)90°扇内ではない到達可能マスの中で最も近いものを優先。
  // 今ターンで側面まで回り込めなければ通常のapproachにフォールバック。
  const reach = [...computeReachable(state, u.id).values()];
  const isFront = (tile) => {
    const fx = Math.sin(target.facingYaw ?? 0), fy = Math.cos(target.facingYaw ?? 0);
    const dx = tile.x - target.x, dy = tile.y - target.y;
    const len = Math.hypot(dx, dy) || 1;
    return (dx / len) * fx + (dy / len) * fy > 0.35;
  };
  const flankable = reach.filter((r) => manhattan(r, target) <= u.range && !isFront(r));
  const pool = flankable.length ? flankable : reach;
  let best = pool[0], bestScore = Infinity, bestStep = Infinity;
  for (const r of pool) {
    const s = manhattan(r, target);
    if (s < bestScore || (s === bestScore && r.dist < bestStep)) { bestScore = s; bestStep = r.dist; best = r; }
  }
  return best;
}

// ── 本体: 1ユニットぶんの1ターンをルールセットから決定する ────────────
export function evaluateGambitTurn(state, unitId, rules) {
  const u = state.units.find((x) => x.id === unitId && x.hp > 0);
  const cmds = [];
  if (!u) return cmds;
  const active = (rules ?? []).filter((r) => r.enabled !== false).slice().sort((a, b) => b.priority - a.priority);

  const targetCache = new Map();
  const targetFor = (type) => {
    if (!type) return null;
    if (!targetCache.has(type)) targetCache.set(type, resolveTarget(state, u, type));
    return targetCache.get(type);
  };

  // ── フェーズA: 移動 ──
  const moveActions = new Set(["moveTo", "retreat"]);
  let plannedPos = { x: u.x, y: u.y };
  for (const rule of active) {
    if (!moveActions.has(rule.then?.action)) continue;
    const condTarget = targetFor(rule.when?.target);
    if (!whenMatches({ x: u.x, y: u.y }, condTarget, rule.when, rule.then.action, u)) continue;
    const actionTarget = targetFor(rule.then?.targetPolicy ?? rule.when?.target);
    if (!actionTarget) continue;

    let dest;
    if (rule.then.action === "retreat") dest = bestRetreatTile(state, u, actionTarget);
    else {
      switch (rule.then.movePolicy) {
        case "keep_distance": dest = bestKeepDistanceTile(state, u, actionTarget); break;
        case "hold_position":
        case "seek_cover": dest = { x: u.x, y: u.y }; break;
        case "approach":
        default:
          dest = rule.ruleId === "flank_approach" ? bestFlankApproachTile(state, u, actionTarget) : bestApproachTile(state, u, actionTarget);
      }
    }
    plannedPos = { x: dest.x, y: dest.y };
    if (dest.x !== u.x || dest.y !== u.y) cmds.push({ type: "move", unitId: u.id, to: { x: dest.x, y: dest.y } });
    break; // 最優先の一致ルールのみ採用
  }

  // ── フェーズB: 最終行動 ──
  const endActions = new Set(["attack", "guard", "wait"]); // useSkillは未実装のため対象外
  let acted = false;
  for (const rule of active) {
    if (!endActions.has(rule.then?.action)) continue;
    const condTarget = targetFor(rule.when?.target);
    if (!whenMatches(plannedPos, condTarget, rule.when, rule.then.action, u)) continue;

    if (rule.then.action === "attack") {
      const actionTarget = targetFor(rule.then?.targetPolicy ?? rule.when?.target);
      if (!actionTarget || manhattan(plannedPos, actionTarget) > u.range) continue; // 実際に届かないなら次点ルールへ
      cmds.push({ type: "attack", unitId: u.id, targetId: actionTarget.id });
      acted = true;
      break;
    }
    // guard / wait: 向きを決めて待機(既存エンジンの「行動終了」表現)
    const facing = targetFor("nearest_enemy");
    const yaw = facing ? Math.atan2(facing.x - plannedPos.x, facing.y - plannedPos.y) : (u.facingYaw ?? 0);
    cmds.push({ type: "faceWait", unitId: u.id, yaw });
    acted = true;
    break;
  }

  // ── フォールバック: 何も該当しなければ必ずターンを終える(硬直防止) ──
  if (!acted) {
    const nearest = targetFor("nearest_enemy");
    if (nearest && manhattan(plannedPos, nearest) <= u.range) {
      cmds.push({ type: "attack", unitId: u.id, targetId: nearest.id });
    } else {
      const yaw = nearest ? Math.atan2(nearest.x - plannedPos.x, nearest.y - plannedPos.y) : (u.facingYaw ?? 0);
      cmds.push({ type: "faceWait", unitId: u.id, yaw });
    }
  }

  return cmds;
}
