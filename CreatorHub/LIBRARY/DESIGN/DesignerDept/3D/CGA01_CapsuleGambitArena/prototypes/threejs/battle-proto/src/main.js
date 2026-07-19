// main.js — 配線層。UI入力を「コマンド」に変換してdispatchする以外のことをしない。
// ダメージ数字・バナー等のDOM演出もここ（イベント消費者）に置き、adapterは3D演出専任。
import { createBattleState, applyCommand, computeReachable, computeAttackable } from "./gameState.js";
import { RenderAdapter } from "./renderAdapter.js";

let state = createBattleState(); // letに変更: Phase3 G1でResult→再戦/タイトルの度に作り直す(FR-3)
const stage = document.getElementById("stage");
// 2.5Dスプライトテストモード: URLに?sprite=1がある時だけ有効。既定はGLB正本のまま。
const spriteMode = new URLSearchParams(location.search).get("sprite") === "1";
const adapter = new RenderAdapter(stage, { spriteMode });

const $ = (id) => document.getElementById(id);
const logEl = $("log");

let curReachable = null;   // 選択中ユニットの到達マス Map（クリック移動判定に使う）
let facingUnitId = null;   // 向き決めモード中のユニット（移動後）
let facingYaw = null;      // カーソル追従で決まった暫定yaw

function enterFacing(unitId) {
  facingUnitId = unitId;
  facingYaw = null;
  const h = $("face-hint");
  if (h) h.style.display = "block";
}
function exitFacing() {
  facingUnitId = null;
  facingYaw = null;
  const h = $("face-hint");
  if (h) h.style.display = "none";
}

function dispatch(cmd) {
  const events = applyCommand(state, cmd);
  adapter.handleEvents(events, state);
  handleUiEvents(events);
  updateRanges();
  renderHud();
  return events;
}

// 選択中の味方・自ターンなら移動/攻撃範囲を表示。それ以外はクリア
function updateRanges() {
  const sel = selectedAlly();
  const myTurn = state.phase === "playing" && state.turn === "ally";
  if (sel && myTurn && !sel.moved) {
    curReachable = computeReachable(state, sel.id);
    const attackKeys = computeAttackable(state, sel.id); // 現在地からの射程（攻撃判定と一致）
    adapter.showRanges(new Set(curReachable.keys()), attackKeys);
  } else if (sel && myTurn && sel.moved && !sel.attacked) {
    curReachable = null; // 移動済みは攻撃のみ
    adapter.showRanges(new Set(), computeAttackable(state, sel.id));
  } else {
    curReachable = null;
    adapter.clearRanges();
  }
}

// ---------- DOM演出（イベント → バナー/ダメージ数字/ログ） ----------
function showBanner(turn) {
  const b = $("turn-banner");
  b.textContent = turn === "ally" ? "PLAYER TURN" : "ENEMY TURN";
  b.classList.toggle("enemy", turn !== "ally");
  b.classList.remove("show");
  void b.offsetWidth; // アニメ再始動
  b.classList.add("show");
}

function popDamage(unitId, damage) {
  const p = adapter.screenPos(unitId);
  if (!p) return;
  const r = stage.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "dmg-pop";
  el.textContent = damage;
  el.style.left = `${p.x - r.left}px`;
  el.style.top = `${p.y - r.top - 8}px`;
  stage.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function showResult(winner) {
  const el = $("result-overlay");
  $("result-title").textContent = winner === "ally" ? "1P WIN" : "CPU WIN";
  el.classList.toggle("win", winner === "ally");
  el.classList.toggle("lose", winner !== "ally");
  el.style.display = "flex";
}

function handleUiEvents(events) {
  for (const ev of events) {
    if (ev.type === "log") {
      const p = document.createElement("p");
      p.innerHTML = `<b>#${String(state.tick).padStart(3, "0")}</b> ${ev.text}`;
      logEl.prepend(p);
    }
    if (ev.type === "battleStarted") $("start-btn").style.display = "none"; // 再戦時に再表示するためremoveしない(FR-3)
    if (ev.type === "turnChanged") {
      showBanner(ev.turn);
      // CPUターンになったら、バナー後に敵AIを自動実行
      if (ev.turn === "enemy") setTimeout(() => dispatch({ type: "enemyTurn" }), 1100);
    }
    // 攻撃の着弾に合わせてダメージ数字（enemyTurnのdelayも反映）
    if (ev.type === "unitAttacked") setTimeout(() => popDamage(ev.targetId, ev.damage), 300 + (ev.delay ?? 0) * 1000);
    if (ev.type === "battleEnded") setTimeout(() => showResult(ev.winner), 900 + (ev.delay ?? 0) * 1000);
    // 味方全員が行動終了 → 自動でターンを渡す
    if (ev.type === "allActed" && ev.team === "ally") {
      setTimeout(() => { if (state.phase === "playing" && state.turn === "ally") dispatch({ type: "endTurn" }); }, 1000);
    }
    // 味方の移動完了 → 向き決めモードへ（カーソル/十字キーで向けてクリックで確定＆待機）
    if (ev.type === "unitMoved" && state.turn === "ally" && state.phase === "playing") {
      const u = state.units.find((x) => x.id === ev.unitId);
      if (u && u.team === "ally" && !u.attacked) enterFacing(ev.unitId);
    }
    // ターン交代・決着・攻撃時は向き決めモードを抜ける
    if (ev.type === "turnChanged" || ev.type === "battleEnded" || ev.type === "unitFaced" ||
        (ev.type === "unitAttacked" && facingUnitId && ev.attackerId === facingUnitId)) {
      exitFacing();
    }
  }
}

// ---------- 固定ステータスパネル（1P左下 / CPU右下） ----------
function renderHud() {
  const panels = [
    { unit: state.units.find((u) => u.team === "ally"), pre: "p1", panel: $("p1-panel") },
    { unit: state.units.find((u) => u.team === "enemy"), pre: "cpu", panel: $("cpu-panel") },
  ];
  for (const { unit: u, pre, panel } of panels) {
    if (!u) continue;
    $(`${pre}-name`).textContent = u.displayName;
    $(`${pre}-pos`).textContent = `(${u.x},${u.y})`;
    $(`${pre}-hp-num`).textContent = `♥ ${u.hp}/${u.maxHp}`;
    $(`${pre}-hp`).style.width = `${(u.hp / u.maxHp) * 100}%`;
    panel.classList.toggle("selected", state.selectedUnitId === u.id);
    panel.classList.toggle("dead", u.hp <= 0);
    panel.classList.toggle("done", u.hp > 0 && u.moved && u.attacked);
  }
  // 行動可能な味方数チップ
  const allies = state.units.filter((u) => u.team === "ally" && u.hp > 0);
  const canAct = allies.filter((u) => !(u.moved && u.attacked)).length;
  const tl = $("turn-left");
  if (tl) tl.textContent = state.phase === "playing" && state.turn === "ally" ? `行動可 ${canAct}/${allies.length}` : (state.turn === "enemy" ? "CPU 行動中" : "");
  const sel = state.units.find((x) => x.id === state.selectedUnitId);
  const myTurn = state.phase === "playing" && state.turn === "ally";
  for (const b of document.querySelectorAll("#motion-bar button[data-clip]")) b.disabled = !sel;
  $("btn-endturn").disabled = !myTurn;
  // 攻撃ボタンは「自ターン中・選択中の味方ユニットの射程内に敵がいる」時だけ有効
  const target = myTurn && sel && sel.team === "ally" && state.units.find((t) => t.team !== sel.team && t.hp > 0 &&
    Math.abs(t.x - sel.x) + Math.abs(t.y - sel.y) <= sel.range);
  $("btn-attack").disabled = !target;
  $("btn-attack").dataset.targetId = target ? target.id : "";
}

// ---------- 入力 → コマンド ----------
$("start-btn").onclick = () => dispatch({ type: "startBattle" });

const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const unitById = (id) => state.units.find((u) => u.id === id);
const selectedAlly = () => {
  const u = unitById(state.selectedUnitId);
  return u && u.team === "ally" && u.hp > 0 ? u : null;
};

// 向き決めモード中: カーソルの方向へ体を追従回転
stage.addEventListener("mousemove", (e) => {
  if (!facingUnitId || $("dbg-orbit").checked) return;
  const y = adapter.faceTowardScreen(facingUnitId, e.clientX, e.clientY);
  if (Number.isFinite(y)) facingYaw = y;
});

// 盤クリック: 向き決め中はクリックで向き確定＆待機。通常時は 隣接敵=攻撃/到達マス=移動/ユニット=選択
stage.addEventListener("click", (e) => {
  if (e.target.closest("button, #hud-stats, .st-panel, #settings")) return;
  if ($("dbg-orbit").checked) return;

  // 向き決めモード: 隣接敵クリックは攻撃、それ以外はクリック方向で向き確定して待機
  if (facingUnitId) {
    const u = unitById(facingUnitId);
    const hitId0 = adapter.pickUnit(e.clientX, e.clientY);
    const hit0 = hitId0 && unitById(hitId0);
    if (u && hit0 && hit0.team === "enemy" && hit0.hp > 0 && !u.attacked && manhattan(u, hit0) <= u.range) {
      dispatch({ type: "attack", unitId: u.id, targetId: hit0.id }); // 攻撃で締める
    } else {
      const yaw = adapter.faceTowardScreen(facingUnitId, e.clientX, e.clientY) ?? facingYaw;
      dispatch({ type: "faceWait", unitId: facingUnitId, yaw });
    }
    return;
  }

  const hitId = adapter.pickUnit(e.clientX, e.clientY);
  const sel = selectedAlly();
  const myTurn = state.phase === "playing" && state.turn === "ally";

  if (hitId) {
    const hit = unitById(hitId);
    // 隣接する敵をクリック → 攻撃
    if (myTurn && sel && hit.team === "enemy" && hit.hp > 0 && manhattan(sel, hit) <= sel.range) {
      dispatch({ type: "attack", unitId: sel.id, targetId: hit.id });
    } else {
      dispatch({ type: "select", unitId: hitId });
    }
    return;
  }
  // 空きマスクリック: 到達範囲(BFS)内なら移動
  const tile = adapter.pickTile(e.clientX, e.clientY);
  if (myTurn && sel && tile && curReachable && curReachable.has(`${tile.x},${tile.y}`) && !(tile.x === sel.x && tile.y === sel.y)) {
    dispatch({ type: "move", unitId: sel.id, to: tile });
  } else if (!tile) {
    dispatch({ type: "deselect" });
  }
});

// キーボード: 矢印/WASD=移動, F/Space=隣接敵へ攻撃, E/Enter=ターン終了, Tab=味方切替
const MOVE_KEYS = {
  ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
};
addEventListener("keydown", (e) => {
  if (e.target?.closest?.("input, textarea")) return; // 入力欄フォーカス中は無視
  if (settings.classList.contains("open")) return;     // 設定を開いている間は無視
  if (state.phase !== "playing" || state.turn !== "ally") return;

  // 向き決めモード: 十字キーで向きを決め、Enter/Spaceで確定して待機
  if (facingUnitId) {
    if (MOVE_KEYS[e.code]) {
      e.preventDefault();
      const [dx, dy] = MOVE_KEYS[e.code];
      facingYaw = Math.atan2(dx, dy);
      adapter.faceYaw(facingUnitId, facingYaw);
    } else if (e.code === "Enter" || e.code === "Space" || e.code === "KeyF") {
      e.preventDefault();
      dispatch({ type: "faceWait", unitId: facingUnitId, yaw: facingYaw ?? undefined });
    }
    return;
  }

  const sel = selectedAlly();
  if (MOVE_KEYS[e.code]) {
    e.preventDefault();
    if (!sel) return;
    const [dx, dy] = MOVE_KEYS[e.code];
    dispatch({ type: "move", unitId: sel.id, to: { x: sel.x + dx, y: sel.y + dy } });
  } else if (e.code === "KeyF" || e.code === "Space") {
    e.preventDefault();
    if (!sel) return;
    const foe = state.units.find((t) => t.team === "enemy" && t.hp > 0 && manhattan(sel, t) <= sel.range);
    if (foe) dispatch({ type: "attack", unitId: sel.id, targetId: foe.id });
  } else if (e.code === "KeyE" || e.code === "Enter") {
    e.preventDefault();
    dispatch({ type: "endTurn" });
  } else if (e.code === "Tab") {
    e.preventDefault();
    const allies = state.units.filter((u) => u.team === "ally" && u.hp > 0);
    if (!allies.length) return;
    const i = allies.findIndex((u) => u.id === state.selectedUnitId);
    dispatch({ type: "select", unitId: allies[(i + 1) % allies.length].id });
  }
});

for (const b of document.querySelectorAll("#motion-bar button[data-clip]")) {
  b.onclick = () => state.selectedUnitId && dispatch({ type: "motion", unitId: state.selectedUnitId, clip: b.dataset.clip });
}
$("btn-attack").onclick = (e) => {
  const targetId = e.currentTarget.dataset.targetId;
  if (state.selectedUnitId && targetId) dispatch({ type: "attack", unitId: state.selectedUnitId, targetId });
};
$("btn-endturn").onclick = () => dispatch({ type: "endTurn" });

$("cmd-exec").onclick = () => {
  try { dispatch(JSON.parse($("cmd-json").value)); }
  catch (err) { dispatch({ type: "__parse_error__" }); console.error(err); }
};
const presets = {
  up: () => {
    const u = state.units.find((x) => x.id === (state.selectedUnitId ?? "ally_drake"));
    return { type: "move", unitId: u.id, to: { x: u.x, y: u.y + (u.team === "ally" ? -1 : 1) } };
  },
  select: () => ({ type: "select", unitId: "ally_drake" }),
  attack: () => ({ type: "attack", unitId: "ally_drake", targetId: "enemy_golem" }),
};
for (const b of document.querySelectorAll("[data-preset]")) {
  b.onclick = () => { $("cmd-json").value = JSON.stringify(presets[b.dataset.preset](), null, 1).replace(/\n\s*/g, " "); };
}

$("dbg-orbit").onchange = (e) => adapter.setDebugOrbit(e.target.checked);
// 2.5Dトグル: ?sprite=1/0 を付けてリロード（実装を単純に保つ）
const spriteToggle = $("dbg-sprite");
if (spriteToggle) {
  spriteToggle.checked = spriteMode;
  spriteToggle.onchange = (e) => {
    const url = new URL(location.href);
    url.searchParams.set("sprite", e.target.checked ? "1" : "0");
    location.href = url.toString();
  };
}
// 「もう一度」の配線は画面フロー節(enterBattle)で行う（Phase3 G1でlocation.reload()から変更、FR-3）

// ---------- 設定画面（歯車→タブ切替） ----------
const settings = $("settings");
const openSettings = () => settings.classList.add("open");
const closeSettings = () => settings.classList.remove("open");
$("gear-btn").onclick = openSettings;
$("settings-close").onclick = closeSettings;
$("settings-resume").onclick = closeSettings;
settings.addEventListener("click", (e) => { if (e.target === settings) closeSettings(); });
for (const tab of document.querySelectorAll(".settings-tabs button")) {
  tab.onclick = () => {
    document.querySelectorAll(".settings-tabs button").forEach((b) => b.classList.toggle("on", b === tab));
    document.querySelectorAll(".settings-body section").forEach((s) => s.classList.toggle("on", s.dataset.panel === tab.dataset.tab));
  };
}
addEventListener("keydown", (e) => { if (e.code === "Escape" && settings.classList.contains("open")) closeSettings(); });

// ---------- FPS/Stats ----------
let frames = 0, acc = 0;
function onFrame(dt, info) {
  frames += 1; acc += dt;
  if (acc >= 1) {
    $("st-fps").textContent = Math.round(frames / acc);
    $("st-calls").textContent = info.render.calls;
    $("st-tris").textContent = info.render.triangles.toLocaleString();
    frames = 0; acc = 0;
  }
}

// ---------- UIテーマ適用（DesignerDept/ui-themes/README.md §B の実装） ----------
async function applyTheme(themeUrl) {
  try {
    const t = await (await fetch(themeUrl + "/theme.json")).json();
    const root = document.documentElement;
    for (const [k, v] of Object.entries(t.palette)) root.style.setProperty(k, v);
    for (const [cid, def] of Object.entries(t.components)) {
      root.style.setProperty(`--img-${cid}`, `url(${themeUrl}/${def.file})`);
      if (def.states) for (const [s, f] of Object.entries(def.states)) {
        root.style.setProperty(`--img-${cid}-${s}`, `url(${themeUrl}/${f})`);
      }
    }
    root.classList.add("theme-on");
    localStorage.setItem("ui-theme", themeUrl);
    console.log(`[CGA-THEME] applied: ${t.themeId}`);
  } catch (e) {
    console.warn("[CGA-THEME] theme load failed, CSS fallback続行", e);
  }
}

// ==================================================================
// 画面フロー（Phase 3 G1）: Title → モード選択 → バトル(既存)。
// Resultの「もう一度/タイトルへ」からも再突入できる(FR-1〜3)。
// バトルロジック(gameState/renderAdapterのイベント処理)には一切手を入れない。
// ==================================================================
const SCREENS = ["title", "modeselect", "battle"];
let currentScreen = null;

function showScreen(name, { updateHash = true } = {}) {
  if (!SCREENS.includes(name)) name = "title";
  currentScreen = name;
  for (const s of SCREENS) $(`screen-${s}`).classList.toggle("active", s === name);
  if (updateHash) history.replaceState(null, "", "#" + name);
}

function applyScreenFromHash() {
  const name = location.hash.slice(1) || "title";
  if (name === "battle" && !battleLoaded) { enterBattle(); return; }
  showScreen(SCREENS.includes(name) ? name : "title", { updateHash: false });
}
addEventListener("hashchange", applyScreenFromHash);

// 画像が届いていればそれを、404ならCSSグラデ(.fallbackクラス)を使う（UIテーマのfallback思想と同じ）
function loadScreenImages(root) {
  for (const el of root.querySelectorAll("[data-img]")) {
    const url = `/art/screens/${el.dataset.img}.png`;
    const img = new Image();
    img.onload = () => { el.style.backgroundImage = `url(${url})`; el.classList.remove("fallback"); };
    img.onerror = () => { el.classList.add("fallback"); };
    el.classList.add("fallback"); // 判定が終わるまでは安全側でfallback表示
    img.src = url;
  }
}
loadScreenImages(document);

// ---------- バトル画面の遅延ロード＋再突入（FR-3: 2周目も正常に遊べる） ----------
let battleLoaded = false;
async function enterBattle() {
  showScreen("battle"); // 先に表示してからload()する（非表示中はcanvasが0x0でカメラ計算が崩れるため）
  $("battle-loading").classList.add("show");
  if (battleLoaded) {
    state = createBattleState();
    adapter.reset();
  }
  await adapter.load(state);
  battleLoaded = true;
  adapter.sync(state);
  if (!frameLoopStarted) { adapter.start(onFrame); frameLoopStarted = true; }
  $("battle-loading").classList.remove("show");

  // 画面まわりのUIを初期状態へ戻す
  logEl.innerHTML = "";
  $("result-overlay").style.display = "none";
  $("result-overlay").classList.remove("win", "lose");
  $("start-btn").style.display = "";
  $("turn-banner").classList.remove("show");
  exitFacing();
  curReachable = null;
  renderHud();
}

$("title-tap").onclick = () => showScreen("modeselect");
$("mode-back").onclick = () => showScreen("title");
$("mode-battle").onclick = () => enterBattle();
$("result-again").onclick = () => enterBattle();
$("result-title-btn").onclick = () => showScreen("title");

// ---------- 起動 ----------
let frameLoopStarted = false;
await applyTheme("/art/ui");
applyScreenFromHash();

// テスト・外部操作用フック（読み取りとdispatchのみ公開）
window.CGA = {
  get state() { return state; },
  get screen() { return currentScreen; },
  dispatch,
  screenPos: (id) => adapter.screenPos(id),
  showScreen: (name) => showScreen(name),
};
