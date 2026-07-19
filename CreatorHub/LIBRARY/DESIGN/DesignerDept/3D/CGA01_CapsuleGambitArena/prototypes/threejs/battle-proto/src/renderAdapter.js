// renderAdapter.js — Game State を受け取り Three.js Scene に反映する片方向アダプタ。
// 契約: このファイルは state を「読む」だけ。書き換えない。
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RangeOverlay } from "./rangeOverlay.js";

const TEAM_COLOR = { ally: 0x2f6fe0, enemy: 0xd03a2e };

const SPRITE_UNIT_ID = "enemy_golem"; // 2.5Dテスト対象（凍結仕様：ゴーレムの見た目のみ差し替え）
const SPRITE_BASE = "/art/ui/field_test/rock_dragon_refsample_v0.2/";
const SPRITE_STATES = ["idle", "attack", "damage", "down", "special", "face_up", "face_down", "face_left", "face_right"];

export class RenderAdapter {
  // spriteMode: URLの?sprite=1で有効。GLB正本は壊さず、ゴーレムのみ板ポリ＋テクスチャで描画する。
  constructor(container, { spriteMode = false } = {}) {
    this.spriteMode = spriteMode;
    this._spriteTex = null;
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.prepend(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x3a6ac8);
    this.scene.fog = new THREE.Fog(0x3a6ac8, 14, 34);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false; // Debug時のみON（引継ぎ書契約）
    this.controls.enableDamping = true;

    this.scene.add(new THREE.HemisphereLight(0xdfefff, 0x2a3b2f, 1.1));
    const sun = new THREE.DirectionalLight(0xfff2d9, 2.0);
    sun.position.set(4, 8, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
    this.scene.add(sun);

    this.loader = new GLTFLoader();
    this.clock = new THREE.Clock();
    this.unitViews = new Map(); // unitId -> {root, model, mixer, actions, base, ring, current}
    this.tweens = [];
    this.raycaster = new THREE.Raycaster();
    this._board = null;
    this.rangeOverlay = new RangeOverlay(this.scene, (x, y, h) => this.worldPos(x, y, h));

    new ResizeObserver(() => this.resize()).observe(container);
  }

  showRanges(moveKeys, attackKeys) { this.rangeOverlay.show(moveKeys, attackKeys); }
  clearRanges() { this.rangeOverlay.clear(); }

  // Phase3 G1(FR-3): Result→再戦/タイトルの度に盤面とユニットを作り直せるよう後片付けする。
  // GLB由来のジオメトリ/マテリアルはキャッシュ共有の可能性があるためdisposeせずシーンから外すだけ。
  // 手続き的に作った台座/リング/カプセルの3部品(1ユニットにつき専有)だけは安全にdisposeする。
  reset() {
    if (this.boardGroup) { this.scene.remove(this.boardGroup); this.boardGroup = null; }
    for (const v of this.unitViews.values()) {
      this.scene.remove(v.root);
      if (v.sprite) { clearTimeout(v.sprite.revert); }
      for (const part of [v.base, v.ring, v.lid, v.cup, v.sprite?.mesh, v.sprite?.shadow]) {
        part?.geometry?.dispose();
        part?.material?.dispose(); // 共有テクスチャ(_spriteTex)はmaterial.dispose()では破棄されない
      }
    }
    this.unitViews.clear();
    this.tweens = [];
    this.clearRanges();
    this._board = null;
  }

  // モデルを目標ヨーへ短時間で補間回転（GLB正面+Z）。dx,dyはグリッド差分
  faceDir(unitId, dx, dy, dur = 0.15) {
    if (dx === 0 && dy === 0) return;
    this.faceYaw(unitId, Math.atan2(dx, dy), dur);
  }

  // 目標ヨーへ補間回転（最短方向）。
  // 「向いた方向を覚える」責務はここ(描画層)に置く：gameStateのfacingYawは
  // プレイヤーのfaceWait操作でしか更新されず敵ターンでは変化しないため、
  // 敵の向きをgameStateから読み続けると常に初期値へ戻ってしまう。
  // v.sprite.yawをここで直接更新し、以後sync()はそれを上書きしない（1回限りの初期値のみ使う）。
  faceYaw(unitId, target, dur = 0.15) {
    const v = this.unitViews.get(unitId);
    if (!v) return;
    if (v.sprite) v.sprite.yaw = RenderAdapter.snapCardinal(target);
    const from = v.model.rotation.y;
    let diff = ((target - from + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    this.tweens.push({ t: 0, dur, step: (k) => { v.model.rotation.y = from + diff * k; } });
  }

  // 生yawを盤の4方向(0, ±PI/2, PI)のうち最も近いものへ丸める
  static snapCardinal(yaw) {
    const step = Math.PI / 2;
    let snapped = Math.round(yaw / step) * step;
    if (snapped > Math.PI) snapped -= Math.PI * 2; // atan2域(-PI..PI]に正規化
    if (snapped <= -Math.PI) snapped += Math.PI * 2;
    return snapped;
  }

  // ライブ向き決め: カーソル位置(スクリーン)を盤面へ投影し、上下左右4方向のうち最も近い向きへ即座に整える。決定したyawを返す
  faceTowardScreen(unitId, clientX, clientY) {
    const v = this.unitViews.get(unitId);
    if (!v) return null;
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.02);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, hit)) return null;
    const dx = hit.x - v.root.position.x, dz = hit.z - v.root.position.z;
    if (Math.abs(dx) < 1e-4 && Math.abs(dz) < 1e-4) return v.model.rotation.y;
    const yaw = RenderAdapter.snapCardinal(Math.atan2(dx, dz));
    v.model.rotation.y = yaw; // 即時（カーソルに吸い付く）
    return yaw;
  }

  // 2.5Dテスト用スプライトを一括ロードして状態名→テクスチャの辞書を返す
  async _loadSpriteTextures() {
    const tl = new THREE.TextureLoader();
    const entries = await Promise.all(SPRITE_STATES.map((n) =>
      tl.loadAsync(`${SPRITE_BASE}sprite_rock_dragon_${n}_512x512.png`).then((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.magFilter = THREE.LinearFilter;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.anisotropy = 4;
        return [n, t];
      })));
    return Object.fromEntries(entries);
  }

  // facingYaw(4方向スナップ済み)を face_* テクスチャキーへ。既定(yaw=0,+Z=手前)は face_down。
  _faceKey(yaw) {
    const s = RenderAdapter.snapCardinal(yaw ?? 0);
    if (Math.abs(s - Math.PI / 2) < 0.6) return "face_right"; // +X
    if (Math.abs(s + Math.PI / 2) < 0.6) return "face_left";  // -X
    if (Math.abs(s) < 0.6) return "face_down";                // +Z 手前
    return "face_up";                                          // -Z 奥
  }

  // スプライトのテクスチャを状態に応じて差し替え。idleはfacingYawからface_*を解決する。
  _setSprite(v, stateName) {
    if (!v?.sprite) return;
    const key = stateName === "idle" ? this._faceKey(v.sprite.yaw) : stateName;
    const tex = this._spriteTex?.[key];
    if (!tex) return;
    v.sprite.state = stateName;
    if (v.sprite.mat.map !== tex) { v.sprite.mat.map = tex; v.sprite.mat.needsUpdate = true; }
  }

  async load(state) {
    if (this.spriteMode && !this._spriteTex) this._spriteTex = await this._loadSpriteTextures();
    const manifest = await (await fetch("/exports/asset-manifest.json")).json();
    const byId = Object.fromEntries(manifest.assets.map((a) => [a.assetId, a]));
    const glbCache = new Map();
    const loadGlb = async (assetId) => {
      if (!glbCache.has(assetId)) {
        glbCache.set(assetId, await this.loader.loadAsync("/exports/" + byId[assetId].glb));
      }
      return glbCache.get(assetId);
    };

    // --- 盤面: 厚縁フレーム + 地形TileのGLBクローン ---
    const { cols, rows, tiles } = state.board;
    const board = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(cols + 0.7, 0.3, rows + 0.7),
      new THREE.MeshStandardMaterial({ color: 0x1d6b4a }),
    );
    frame.position.y = -0.18;
    frame.receiveShadow = true;
    board.add(frame);

    const terrainIds = [...new Set(tiles.flat())];
    for (const tid of terrainIds) await loadGlb(`field_${tid}`.replace("field_field_", "field_"));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const gltf = glbCache.get(`field_${tiles[y][x]}`);
        const tile = gltf.scene.clone(true);
        tile.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
        tile.position.copy(this.worldPos(x, y, 0));
        board.add(tile);
      }
    }
    this.scene.add(board);
    this.boardGroup = board;
    this._board = { cols, rows };

    // --- ユニット: GLB + チーム台座 + 選択リング ---
    for (const u of state.units) {
      const gltf = await loadGlb(u.assetId);
      const root = new THREE.Group();
      root.name = `unit:${u.id}`;

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.38, 0.08, 28),
        new THREE.MeshStandardMaterial({ color: TEAM_COLOR[u.team], roughness: 0.35 }),
      );
      base.position.y = 0.06;
      base.castShadow = base.receiveShadow = true;
      root.add(base);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.035, 10, 40),
        new THREE.MeshBasicMaterial({ color: 0xf5d77d }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.12;
      ring.visible = false;
      root.add(ring);

      const isSprite = this.spriteMode && u.id === SPRITE_UNIT_ID;
      let model, sprite = null;
      if (isSprite) {
        // 2.5D: GLBの代わりに接地ピボット付きの板ポリ＋テクスチャ。model=pivotとして既存演出(capsuleOpen/defeat)を流用する。
        const pivot = new THREE.Group(); // root原点(=足元)に置き、ここを軸にカメラ正対させると板の下端が接地したまま傾く
        const mat = new THREE.MeshBasicMaterial({
          map: this._spriteTex.face_down, transparent: true, alphaTest: 0.45,
          side: THREE.DoubleSide, depthWrite: true, toneMapped: false,
        });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), mat);
        plane.position.y = 0.45; // 板の下端をピボット原点(足元)に合わせる
        pivot.add(plane);
        // 足元の半透明黒楕円影
        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(0.32, 24),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.scale.set(1, 0.62, 1); // 楕円
        shadow.position.y = 0.021;
        root.add(shadow);
        sprite = { pivot, mesh: plane, mat, shadow, state: "idle", yaw: u.facingYaw ?? 0, revert: 0 };
        model = pivot;
        model.scale.setScalar(0.001); // 開戦(capsuleOpen)まではカプセルの中
        root.add(model);
      } else {
        model = gltf.scene; // 各assetId 1体ずつなのでcloneは不要（Phase 0）
        model.position.y = 0.1;
        model.rotation.y = u.team === "ally" ? Math.PI : 0; // GLB正面+Z。味方は奥(-Z)を向く
        model.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        model.scale.setScalar(0.001); // 開戦(capsuleOpen)まではカプセルの中
        root.add(model);
      }

      // 半透明カプセル（開戦演出用。Runtime側の持ち物＝GLBには含めない契約）
      const capMat = new THREE.MeshStandardMaterial({
        color: 0xdff2ff, transparent: true, opacity: 0.55, roughness: 0.15, metalness: 0.1,
      });
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
      lid.position.y = 0.42;
      const cup = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: TEAM_COLOR[u.team], roughness: 0.3, transparent: true, opacity: 0.92 }),
      );
      cup.position.y = 0.42;
      const capsule = new THREE.Group();
      capsule.add(lid, cup);
      root.add(capsule);

      const mixer = new THREE.AnimationMixer(model);
      const actions = {};
      if (!isSprite) for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);

      root.position.copy(this.worldPos(u.x, u.y, 0.02));
      this.scene.add(root);
      this.unitViews.set(u.id, { root, model, mixer, actions, base, ring, capsule, lid, cup, sprite, current: null });
      this.playClip(u.id, "idle");
    }

    this.resize();
  }

  worldPos(x, y, h = 0) {
    const { cols, rows } = this._board ?? { cols: 5, rows: 6 };
    return new THREE.Vector3(x - (cols - 1) / 2, h, y - (rows - 1) / 2);
  }

  /** 状態を丸ごと反映（選択リング・座標）。アニメ演出はhandleEventsで行う */
  sync(state) {
    for (const u of state.units) {
      const v = this.unitViews.get(u.id);
      if (!v) continue;
      v.ring.visible = state.selectedUnitId === u.id;
      if (!v.tweening) v.root.position.copy(this.worldPos(u.x, u.y, 0.02));
      // v.sprite.yawはfaceYaw()が更新する「直近に向いた方向」が正（gameStateのfacingYawは
      // プレイヤーのfaceWait操作でしか変わらず敵は追従しないため、ここでは読み直さない）。
      // idle表示への反映だけここで行う。
      if (v.sprite && v.sprite.state === "idle") {
        this._setSprite(v, "idle");
      }
    }
  }

  /** applyCommandが返したイベントを演出に変換する */
  handleEvents(events, state) {
    for (const ev of events) {
      if (ev.type === "unitMoved") {
        const v = this.unitViews.get(ev.unitId);
        if (!v) continue;
        const delay = ev.delay ?? 0;
        // path(始点除く)があれば各マスを順に辿る。無ければ単一ステップ（敵AI等）。jump=trueの区間は放物線で飛び越える
        const steps = ev.path && ev.path.length ? ev.path : [{ ...ev.to, jump: false }];
        const pts = [ev.from, ...steps].map((s) => this.worldPos(s.x, s.y, 0.02));
        const perStep = 0.28;
        v.tweening = true;
        let segCursor = 0;
        for (let i = 0; i < steps.length; i++) {
          const a = pts[i], b = pts[i + 1];
          const prev = i === 0 ? ev.from : steps[i - 1];
          const cur = steps[i];
          const segDur = cur.jump ? perStep * 1.7 : perStep; // ジャンプ区間は少し長め（跳躍の間を持たせる）
          const segDelay = delay + segCursor;
          segCursor += segDur;
          // 各ステップ開始時に進行方向へ向く
          this.tweens.push({ t: -segDelay, dur: 0.01, step: () => {}, done: () => this.faceDir(ev.unitId, cur.x - prev.x, cur.y - prev.y) });
          this.tweens.push({
            t: -segDelay, dur: segDur,
            step: (k) => {
              v.root.position.lerpVectors(a, b, k);
              if (cur.jump) v.root.position.y = a.y + Math.sin(k * Math.PI) * 0.55; // 放物線で1マス飛び越える
            },
            done: i === steps.length - 1 ? () => { v.tweening = false; this.playClip(ev.unitId, "idle"); } : undefined,
          });
        }
        this.tweens.push({ t: -delay, dur: 0.01, step: () => {}, done: () => this.playClip(ev.unitId, "move") });
      }
      if (ev.type === "playMotion") {
        const once = ev.clip === "attack" || ev.clip === "hit";
        this.playClip(ev.unitId, ev.clip, { once });
      }
      if (ev.type === "unitFaced" && Number.isFinite(ev.yaw)) {
        this.faceYaw(ev.unitId, ev.yaw);
      }
      if (ev.type === "capsuleOpen") {
        const v = this.unitViews.get(ev.unitId);
        if (!v?.capsule) continue;
        const lidY0 = v.lid.position.y;
        this.tweens.push({
          t: -(ev.delay ?? 0), dur: 0.7,
          step: (k) => {
            v.lid.position.y = lidY0 + k * 1.6;
            v.lid.rotation.z = k * 2.4;
            v.lid.material.opacity = 0.55 * (1 - k);
            v.cup.material.opacity = 0.92 * (1 - k);
            v.cup.scale.setScalar(1 + k * 0.35);
            // ユニット本体はやや遅れて弾み出る
            const m = Math.min(Math.max((k - 0.25) / 0.75, 0), 1);
            const over = m < 0.7 ? (m / 0.7) * 1.12 : 1.12 - ((m - 0.7) / 0.3) * 0.12;
            v.model.scale.setScalar(Math.max(0.001, over));
          },
          done: () => { v.capsule.visible = false; this.playClip(ev.unitId, "idle"); },
        });
      }
      if (ev.type === "unitAttacked") {
        const a = this.unitViews.get(ev.attackerId);
        const t = this.unitViews.get(ev.targetId);
        if (!a || !t) continue;
        const delay = ev.delay ?? 0;
        // 攻撃者はターゲットへ、被弾側は攻撃者の方へ向く（遅延明けに）
        const au = state.units.find((u) => u.id === ev.attackerId);
        const tu = state.units.find((u) => u.id === ev.targetId);
        if (au && tu) {
          this.tweens.push({ t: -delay, dur: 0.01, step: () => {}, done: () => {
            this.faceDir(ev.attackerId, tu.x - au.x, tu.y - au.y);
            this.faceDir(ev.targetId, au.x - tu.x, au.y - tu.y);
          } });
        }
        // 攻撃時は攻撃者の現在位置ではなく、遅延明けの位置から突進させる（移動と連続する敵ターン対策）
        a.tweening = true;
        this.tweens.push({
          t: -delay, dur: 0.5,
          step: (k) => {
            if (k <= 0) return; // 遅延中は移動トゥイーンに任せる
            if (!a._lungeFrom) {
              a._lungeFrom = a.root.position.clone();
              a._lungeDir = t.root.position.clone().sub(a._lungeFrom).setY(0).normalize().multiplyScalar(0.34);
            }
            const lunge = k < 0.5 ? k * 2 : (1 - k) * 2;
            a.root.position.copy(a._lungeFrom).addScaledVector(a._lungeDir, lunge);
          },
          done: () => { a.tweening = false; a._lungeFrom = null; a._lungeDir = null; },
        });
        this.tweens.push({ t: -delay, dur: 0.01, step: () => {}, done: () => this.playClip(ev.attackerId, "attack", { once: true }) });
        this.tweens.push({ t: -(delay + 0.22), dur: 0.01, step: () => {}, done: () => this.playClip(ev.targetId, "hit", { once: true }) });
      }
      if (ev.type === "unitDefeated") {
        const v = this.unitViews.get(ev.unitId);
        if (!v) continue;
        if (v.sprite) { clearTimeout(v.sprite.revert); this._setSprite(v, "down"); } // 撃破テクスチャ（縮小フェードは既存演出）
        const delay = ev.delay ?? 0;
        this.tweens.push({
          t: -(delay + 0.3), dur: 0.8,
          step: (k) => {
            v.root.scale.setScalar(Math.max(0.001, 1 - k));
            v.root.position.y = 0.02 - k * 0.25;
          },
          done: () => { v.root.visible = false; },
        });
      }
    }
    this.sync(state);
  }

  playClip(unitId, name, { once = false } = {}) {
    const v = this.unitViews.get(unitId);
    if (!v) return;
    // 2.5D: クリップ名→スプライト状態へ写像。idle/move→idle(facing) / attack→attack / hit→damage。
    // special は未使用（将来の必殺演出用に予約）。
    if (v.sprite) {
      const map = { idle: "idle", move: "idle", attack: "attack", hit: "damage" };
      const s = map[name] ?? "idle";
      this._setSprite(v, s);
      if (once && (s === "attack" || s === "damage")) {
        clearTimeout(v.sprite.revert);
        v.sprite.revert = setTimeout(() => { if (v.sprite.state === s) this._setSprite(v, "idle"); }, 500);
      }
      v.current = name;
      return;
    }
    const action = v.actions[name];
    if (!action) return;
    v.mixer.stopAllAction();
    action.reset();
    action.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = once;
    action.play();
    v.current = name;
    if (once) {
      const back = () => { v.mixer.removeEventListener("finished", back); this.playClip(unitId, "idle"); };
      v.mixer.addEventListener("finished", back);
    }
  }

  /** クリック座標からユニットIDを返す（なければnull） */
  pickUnit(clientX, clientY) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const roots = [...this.unitViews.values()].filter((v) => v.root.visible).map((v) => v.root);
    const hit = this.raycaster.intersectObjects(roots, true)[0];
    let o = hit?.object;
    while (o && !o.name.startsWith("unit:")) o = o.parent;
    return o ? o.name.slice(5) : null;
  }

  /** クリック座標から盤面のマス{x,y}を返す（盤外ならnull） */
  pickTile(clientX, clientY) {
    const { cols, rows } = this._board ?? { cols: 5, rows: 6 };
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.02); // タイル上面 y=0.02
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, hit)) return null;
    const x = Math.round(hit.x + (cols - 1) / 2);
    const y = Math.round(hit.z + (rows - 1) / 2);
    if (x < 0 || x >= cols || y < 0 || y >= rows) return null;
    return { x, y };
  }

  /** テスト用: ユニットのスクリーン座標 */
  screenPos(unitId) {
    const v = this.unitViews.get(unitId);
    if (!v) return null;
    const p = v.root.position.clone().add(new THREE.Vector3(0, 0.35, 0)).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((-p.y + 1) / 2) * r.height };
  }

  setDebugOrbit(on) {
    this.controls.enabled = on;
    if (!on) this.fitCamera();
  }

  /** 固定斜視カメラ。盤全体がはみ出さない距離を逆算する（引継ぎ書: Orbit禁止・固定斜視） */
  fitCamera() {
    const { cols, rows } = this._board ?? { cols: 5, rows: 6 };
    const w = cols + 1.4, d = rows + 1.4;
    const aspect = this.camera.aspect;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const elev = THREE.MathUtils.degToRad(52);
    // 奥行きは俯角で投影されて縮むぶんを含めて必要距離を計算
    const distW = (w / 2) / Math.tan(hFov / 2);
    const distH = (d / 2) / Math.tan(vFov / 2) * Math.sin(elev) + (d / 2) * Math.cos(elev);
    const dist = Math.max(distW, distH) + 1.6;
    const target = new THREE.Vector3(0, 0, 0.2);
    this.camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist).add(target);
    this.camera.lookAt(target);
    this.controls.target.copy(target);
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (!this.controls.enabled) this.fitCamera();
  }

  start(onFrame) {
    this.renderer.setAnimationLoop(() => {
      const dt = this.clock.getDelta();
      for (const v of this.unitViews.values()) {
        v.mixer.update(dt);
        // 2.5D: 板ポリを毎フレームカメラへ完全正対（ピボットは足元なので下端が接地したまま）
        if (v.sprite) v.sprite.pivot.quaternion.copy(this.camera.quaternion);
      }
      for (const tw of this.tweens) {
        tw.t += dt;
        // t<0 は遅延中。stepを一切呼ばない（経路の後続セグメントが終点へ位置を上書きするのを防ぐ）
        if (tw.t < 0) continue;
        const k = Math.min(tw.t / tw.dur, 1);
        tw.step(k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2); // easeInOut
        if (k >= 1 && !tw.finished) { tw.finished = true; tw.done?.(); }
      }
      this.tweens = this.tweens.filter((t) => !t.finished);
      if (this.controls.enabled) this.controls.update();
      this.renderer.render(this.scene, this.camera);
      onFrame?.(dt, this.renderer.info);
    });
  }
}
