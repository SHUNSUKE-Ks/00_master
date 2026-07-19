// gameState.js — 純粋なゲーム状態とコマンド適用。
// 契約: このファイルはThree.jsを一切importしない（Game State -> Render Adapter -> Scene の一方向）。

// overrides.units を渡すと初期ユニット構成を差し替えられる（省略時は従来と完全一致）。
// アリーナ(prototypes/arena)の多対多対戦用。battle-proto本体は無引数呼び出しのため影響なし。
export function createBattleState(overrides) {
  return {
    tick: 0,
    phase: "setup", // setup -> playing -> victory | defeat
    turn: "ally",   // ally | enemy
    board: {
      cols: 5,
      rows: 6,
      // y=0が敵側(奥)、y=5が味方側(手前)。terrainIdはCSV(terrain_master)に一致
      tiles: [
        ["plain", "plain", "forest", "plain", "plain"],
        ["plain", "plain", "plain", "plain", "shallow_water"],
        ["forest", "plain", "plain", "plain", "plain"],
        ["plain", "plain", "shallow_water", "plain", "forest"],
        ["plain", "plain", "plain", "plain", "plain"],
        ["plain", "forest", "plain", "plain", "plain"],
      ],
    },
    units: overrides?.units ?? [
      { id: "ally_drake", assetId: "unit_test_capsule_001", displayName: "テストドレイク", team: "ally", x: 1, y: 4, hp: 28, maxHp: 28, atk: 10, def: 6, move: 3, range: 1, movementType: "ground", moved: false, attacked: false, waited: false, facingYaw: Math.PI },
      { id: "enemy_golem", assetId: "unit_test_capsule_003", displayName: "テストゴーレム", team: "enemy", x: 3, y: 1, hp: 58, maxHp: 58, atk: 14, def: 22, move: 2, range: 1, movementType: "heavy_ground", moved: false, attacked: false, waited: false, facingYaw: 0 },
    ],
    selectedUnitId: null,
    log: [],
  };
}

export function terrainAt(state, x, y) {
  return state.board.tiles[y]?.[x] ?? null;
}

export function unitAt(state, x, y) {
  return state.units.find((u) => u.hp > 0 && u.x === x && u.y === y) ?? null;
}

// ダメージ式（暫定）: max(1, atk - floor(def/3))。原本メモの多段攻撃式は2D側で検証後に差し替える
export function calcDamage(attacker, defender) {
  return Math.max(1, attacker.atk - Math.floor(defender.def / 3));
}

const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const living = (state, team) => state.units.filter((u) => u.hp > 0 && u.team === team);
const gkey = (x, y) => `${x},${y}`;

// 出典: CreatorGameLab/titleGameStudios/CGA01_CapsuleGambitArena/public/data/terrain_master_v0_1.csv
// （2026-07-18時点）の passableMovementTypes 列を転記。CSVが正。今回は定数だが将来はCSV読込に置き換える。
const TERRAIN_PASSABLE = {
  plain: ["ground", "heavy_ground", "flying", "amphibious", "floating", "burrow"],
  forest: ["ground", "flying", "amphibious", "floating", "burrow"],
  road: ["ground", "heavy_ground", "flying", "amphibious", "floating", "burrow"],
  bridge: ["ground", "heavy_ground", "flying", "amphibious", "floating"],
  shallow_water: ["ground", "flying", "aquatic", "amphibious", "floating"],
  deep_water: ["flying", "aquatic", "amphibious", "floating"],
  lava: ["flying", "floating"],
  cliff: ["flying", "floating"],
  void: ["flying"],
};

// そのマスへ指定movementTypeのユニットが進入・通過できるか（地形のみの判定。ユニット占有は別チェック）
export function isPassable(state, x, y, movementType) {
  const t = terrainAt(state, x, y);
  if (!t) return false; // 盤外相当
  const list = TERRAIN_PASSABLE[t];
  return list ? list.includes(movementType) : true; // 未定義地形は安全側で通行可扱い
}

// BFS(実質Dijkstra)で move値ぶんの到達マスを返す。地形コストは全1、ジャンプのみコスト2。
// 通行不可(地形)は進入・通過とも不可。占有マスも進入不可。
// ジャンプ: 直交1マス先が地形的に進入不可でも、直線2マス先が進入可能・空きならコスト2で飛び越えられる
//   （占有ユニットは飛び越え不可＝地形ブロックのみが対象。GAME/BattleEngine系の設計は参照せず本Phaseで新規定義）
// 戻り値 Map<"x,y",{x,y,dist,parent,jump}>（自マス含む。jump=trueはparentからこのマスへの遷移がジャンプ）
export function computeReachable(state, unitId) {
  const u = state.units.find((x) => x.id === unitId && x.hp > 0);
  const result = new Map();
  if (!u) return result;
  const { cols, rows } = state.board;
  const mt = u.movementType ?? "ground";
  result.set(gkey(u.x, u.y), { x: u.x, y: u.y, dist: 0, parent: null, jump: false });
  const frontier = [{ x: u.x, y: u.y, dist: 0 }];
  while (frontier.length) {
    // 常に最小distを次に処理する（ジャンプでコストが1/2混在するため単純FIFOでは最短性が崩れる）
    let bi = 0;
    for (let i = 1; i < frontier.length; i++) if (frontier[i].dist < frontier[bi].dist) bi = i;
    const cur = frontier.splice(bi, 1)[0];
    if (cur.dist >= u.move) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      const stepOk = isPassable(state, nx, ny, mt);
      if (stepOk && !unitAt(state, nx, ny)) {
        const k = gkey(nx, ny);
        if (!result.has(k) && cur.dist + 1 <= u.move) {
          result.set(k, { x: nx, y: ny, dist: cur.dist + 1, parent: gkey(cur.x, cur.y), jump: false });
          frontier.push({ x: nx, y: ny, dist: cur.dist + 1 });
        }
        continue;
      }
      if (!stepOk) {
        // 直交1マス先が地形的に進入不可 → 直線2マス先へのジャンプを試す
        const jx = cur.x + dx * 2, jy = cur.y + dy * 2;
        if (jx < 0 || jx >= cols || jy < 0 || jy >= rows) continue;
        if (!isPassable(state, jx, jy, mt) || unitAt(state, jx, jy)) continue;
        const jk = gkey(jx, jy);
        if (!result.has(jk) && cur.dist + 2 <= u.move) {
          result.set(jk, { x: jx, y: jy, dist: cur.dist + 2, parent: gkey(cur.x, cur.y), jump: true });
          frontier.push({ x: jx, y: jy, dist: cur.dist + 2 });
        }
      }
    }
  }
  return result;
}

// reachableから到達マスまでの最短経路（始点を除く配列。各要素にjumpフラグ付き）を返す。無ければnull
export function reachablePath(reachable, toX, toY) {
  let node = reachable.get(gkey(toX, toY));
  if (!node) return null;
  const path = [];
  while (node && node.parent) {
    path.unshift({ x: node.x, y: node.y, jump: !!node.jump });
    node = reachable.get(node.parent);
  }
  return path;
}

// 攻撃可能マスの集合。reachable省略時は現在地からのrange（攻撃判定と一致）
export function computeAttackable(state, unitId, reachable) {
  const u = state.units.find((x) => x.id === unitId && x.hp > 0);
  const set = new Set();
  if (!u) return set;
  const { cols, rows } = state.board;
  const froms = reachable ? [...reachable.values()] : [{ x: u.x, y: u.y }];
  for (const f of froms) {
    for (let dy = -u.range; dy <= u.range; dy++) {
      const ady = Math.abs(dy);
      for (let dx = -u.range; dx <= u.range; dx++) {
        if (ady + Math.abs(dx) > u.range || (dx === 0 && dy === 0)) continue;
        const tx = f.x + dx, ty = f.y + dy;
        if (tx < 0 || tx >= cols || ty < 0 || ty >= rows) continue;
        set.add(gkey(tx, ty));
      }
    }
  }
  return set;
}

export function hasActed(u) { return u.attacked || u.waited; }

// 行動終了とみなす: 攻撃済み or 向きを決めて待機済み（移動後は必ず向き決め=faceWaitで締める設計）
function isDone(state, u) {
  return u.attacked || u.waited;
}

function resetTeamActions(state, team) {
  for (const u of state.units) if (u.team === team) { u.moved = false; u.attacked = false; u.waited = false; }
}

// チーム全員が行動終了なら allActed を積む（自動ターン交代のトリガー）
function checkAllActed(state, team, events) {
  const alive = living(state, team);
  if (alive.length && alive.every((u) => isDone(state, u))) {
    events.push({ type: "allActed", team });
  }
}

// 最寄りの生存する敵対ユニット
function nearestEnemy(state, unit) {
  const foes = living(state, unit.team === "ally" ? "enemy" : "ally");
  let best = null, bestD = Infinity;
  for (const f of foes) { const d = manhattan(unit, f); if (d < bestD) { bestD = d; best = f; } }
  return best;
}

// targetへ1マス近づく空きマスを返す（距離の大きい軸を優先）。無ければnull
// 簡易AIのため経路探索やジャンプは行わない。地形的に進入不可なマスへは進まない（FR-4）
function stepToward(state, unit, target) {
  const mt = unit.movementType ?? "ground";
  const dx = target.x - unit.x, dy = target.y - unit.y;
  const cands = [];
  const pushX = () => cands.push({ x: unit.x + Math.sign(dx), y: unit.y });
  const pushY = () => cands.push({ x: unit.x, y: unit.y + Math.sign(dy) });
  if (Math.abs(dx) >= Math.abs(dy)) { if (dx) pushX(); if (dy) pushY(); }
  else { if (dy) pushY(); if (dx) pushX(); }
  for (const c of cands) {
    if (c.x < 0 || c.x >= state.board.cols || c.y < 0 || c.y >= state.board.rows) continue;
    if (!isPassable(state, c.x, c.y, mt)) continue;
    if (unitAt(state, c.x, c.y)) continue;
    return c;
  }
  return null;
}

// 勝敗判定。決着したらphaseを更新しbattleEndedを積んでtrueを返す（勝敗方式=全滅。Q06未確定のため差し替え可）
function checkEnd(state, events, log) {
  const allyAlive = living(state, "ally").length;
  const enemyAlive = living(state, "enemy").length;
  if (allyAlive > 0 && enemyAlive > 0) return false;
  const winner = allyAlive > 0 ? "ally" : "enemy";
  state.phase = winner === "ally" ? "victory" : "defeat";
  state.turn = null;
  state.selectedUnitId = null;
  events.push({ type: "battleEnded", winner });
  log(winner === "ally" ? "勝利！ 敵を全滅させた" : "敗北… 味方が全滅した");
  return true;
}

/**
 * コマンドを状態へ適用し、描画側が消費するイベント列を返す。
 * cmd例: {type:"startBattle"} / {type:"select", unitId} / {type:"deselect"} /
 *        {type:"move", unitId, to:{x,y}} / {type:"attack", unitId, targetId} /
 *        {type:"motion", unitId, clip} / {type:"endTurn"}
 */
export function applyCommand(state, cmd) {
  const events = [];
  const log = (text) => {
    state.log.push({ tick: state.tick, text });
    events.push({ type: "log", text });
  };
  state.tick += 1;

  switch (cmd?.type) {
    case "startBattle": {
      if (state.phase !== "setup") { log("startBattle失敗: すでに開戦済み"); break; }
      state.phase = "playing";
      resetTeamActions(state, "ally");
      resetTeamActions(state, "enemy");
      events.push({ type: "battleStarted" });
      state.units.forEach((u, i) => events.push({ type: "capsuleOpen", unitId: u.id, delay: 0.25 + i * 0.4 }));
      events.push({ type: "turnChanged", turn: state.turn });
      log("開戦！ カプセルが開く");
      break;
    }
    case "select": {
      const u = state.units.find((x) => x.id === cmd.unitId && x.hp > 0);
      if (!u) { log(`select失敗: ${cmd.unitId} は存在しない`); break; }
      state.selectedUnitId = u.id;
      events.push({ type: "selectionChanged", unitId: u.id });
      log(`${u.displayName} を選択`);
      break;
    }
    case "deselect": {
      state.selectedUnitId = null;
      events.push({ type: "selectionChanged", unitId: null });
      break;
    }
    case "move": {
      if (state.phase !== "playing") { log("move失敗: 開戦前（startBattleを実行）"); break; }
      const u = state.units.find((x) => x.id === cmd.unitId && x.hp > 0);
      if (!u) { log(`move失敗: ${cmd.unitId} は存在しない`); break; }
      if (u.team !== state.turn) { log(`move失敗: いまは${state.turn === "ally" ? "1P" : "CPU"}のターン`); break; }
      if (u.attacked) { log("move失敗: 攻撃後は移動できない"); break; }
      if (u.moved) { log("move失敗: このターンは移動済み"); break; }
      const { x, y } = cmd.to ?? {};
      if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= state.board.cols || y < 0 || y >= state.board.rows) {
        log(`move失敗: (${x},${y}) は盤外`); break;
      }
      if (unitAt(state, x, y)) { log(`move失敗: (${x},${y}) には別ユニットがいる`); break; }
      const reachable = computeReachable(state, u.id);
      if (!reachable.has(gkey(x, y))) { log(`move失敗: (${x},${y}) は到達範囲外（移動${u.move}）`); break; }
      const path = reachablePath(reachable, x, y);
      const from = { x: u.x, y: u.y };
      u.x = x; u.y = y; u.moved = true;
      events.push({ type: "unitMoved", unitId: u.id, from, to: { x, y }, path });
      log(`${u.displayName} が (${from.x},${from.y})→(${x},${y}) へ移動 [${terrainAt(state, x, y)}]`);
      checkAllActed(state, u.team, events);
      break;
    }
    case "attack": {
      if (state.phase !== "playing") { log("attack失敗: 開戦前（startBattleを実行）"); break; }
      const a = state.units.find((x) => x.id === cmd.unitId && x.hp > 0);
      const t = state.units.find((x) => x.id === cmd.targetId && x.hp > 0);
      if (!a || !t) { log("attack失敗: ユニットが存在しない"); break; }
      if (a.team !== state.turn) { log(`attack失敗: いまは${state.turn === "ally" ? "1P" : "CPU"}のターン`); break; }
      if (a.team === t.team) { log("attack失敗: 味方は攻撃できない"); break; }
      if (a.attacked) { log("attack失敗: このターンは攻撃済み"); break; }
      const dist = Math.abs(a.x - t.x) + Math.abs(a.y - t.y);
      if (dist > a.range) { log(`attack失敗: 射程外 (距離${dist} > 射程${a.range})`); break; }
      const damage = calcDamage(a, t);
      t.hp = Math.max(0, t.hp - damage);
      a.attacked = true;
      events.push({ type: "unitAttacked", attackerId: a.id, targetId: t.id, damage });
      log(`${a.displayName} の攻撃！ ${t.displayName} に ${damage} ダメージ (残HP ${t.hp})`);
      if (t.hp <= 0) {
        events.push({ type: "unitDefeated", unitId: t.id });
        if (state.selectedUnitId === t.id) state.selectedUnitId = null;
        log(`${t.displayName} を撃破！`);
        if (checkEnd(state, events, log)) break;
      }
      checkAllActed(state, a.team, events);
      break;
    }
    case "enemyTurn": {
      // 敵の簡易AI: 各敵が最寄りの味方へ1マス寄り、射程内なら攻撃。GambitDBの本格AI(Q04)は後日
      if (state.phase !== "playing") { log("enemyTurn失敗: 進行中でない"); break; }
      if (state.turn !== "enemy") { log("enemyTurn失敗: CPUターンでない"); break; }
      let delay = 0;
      for (const e of living(state, "enemy")) {
        const target = nearestEnemy(state, e);
        if (!target) break;
        if (manhattan(e, target) > e.range) {
          const to = stepToward(state, e, target);
          if (to) {
            const from = { x: e.x, y: e.y };
            e.x = to.x; e.y = to.y; e.moved = true;
            events.push({ type: "unitMoved", unitId: e.id, from, to, delay });
            log(`${e.displayName} が (${from.x},${from.y})→(${to.x},${to.y}) へ移動`);
            delay += 0.7;
          }
        }
        if (manhattan(e, target) <= e.range && target.hp > 0) {
          const damage = calcDamage(e, target);
          target.hp = Math.max(0, target.hp - damage);
          e.attacked = true;
          events.push({ type: "unitAttacked", attackerId: e.id, targetId: target.id, damage, delay });
          log(`${e.displayName} の攻撃！ ${target.displayName} に ${damage} ダメージ (残HP ${target.hp})`);
          delay += 0.6;
          if (target.hp <= 0) {
            events.push({ type: "unitDefeated", unitId: target.id, delay });
            log(`${target.displayName} を撃破！`);
            if (checkEnd(state, events, log)) break;
          }
        }
      }
      if (state.phase === "playing") {
        state.turn = "ally";
        resetTeamActions(state, "ally"); // 次に動くチームの行動権を回復
        events.push({ type: "turnChanged", turn: "ally", delay: delay + 0.2 });
        log("ターン交代 → 1P");
      }
      break;
    }
    case "endTurn": {
      if (state.phase !== "playing") { log("endTurn失敗: 開戦前"); break; }
      state.turn = state.turn === "ally" ? "enemy" : "ally";
      resetTeamActions(state, state.turn); // 次に動くチームの行動権を回復
      state.selectedUnitId = null;
      events.push({ type: "selectionChanged", unitId: null });
      events.push({ type: "turnChanged", turn: state.turn });
      log(`ターン交代 → ${state.turn === "ally" ? "1P" : "CPU"}`);
      break;
    }
    case "faceWait": {
      // 移動後の向き決め＋待機（この味方の行動を終える）。yawはワールドのY回転(GLB正面+Z基準)
      if (state.phase !== "playing") { log("faceWait失敗: 進行中でない"); break; }
      const u = state.units.find((x) => x.id === cmd.unitId && x.hp > 0);
      if (!u) { log(`faceWait失敗: ${cmd.unitId} は存在しない`); break; }
      if (u.team !== state.turn) { log("faceWait失敗: 自分のターンでない"); break; }
      if (Number.isFinite(cmd.yaw)) u.facingYaw = cmd.yaw;
      u.waited = true;
      events.push({ type: "unitFaced", unitId: u.id, yaw: u.facingYaw });
      log(`${u.displayName}: 向きを決めて待機`);
      checkAllActed(state, u.team, events);
      break;
    }
    case "motion": {
      const u = state.units.find((x) => x.id === cmd.unitId);
      const ok = ["idle", "move", "attack", "hit"].includes(cmd.clip);
      if (!u || !ok) { log(`motion失敗: ${cmd.unitId}/${cmd.clip}`); break; }
      events.push({ type: "playMotion", unitId: u.id, clip: cmd.clip });
      log(`${u.displayName}: ${cmd.clip} 再生`);
      break;
    }
    default:
      log(`不明なコマンド: ${JSON.stringify(cmd)}`);
  }
  return events;
}
