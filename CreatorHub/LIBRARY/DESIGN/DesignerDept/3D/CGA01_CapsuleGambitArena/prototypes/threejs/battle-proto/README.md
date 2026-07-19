# battle-proto — CGA01 Battle 3D（Phase 1まで実装）

5x6盤 + 地形3種 + UNIT2体。クリック選択・JSONコマンド移動・4モーション再生（Phase 0）に加え、
カプセル開封演出・ターンバナー・ダメージ数字・1P/CPU固定パネル・attack/endTurnコマンド（Phase 1）。

## 起動

```
cd prototypes/threejs/battle-proto
npm install   # 初回のみ
npm run dev   # http://127.0.0.1:5198
```

## アーキテクチャ（引継ぎ書の一方向契約）

```
src/gameState.js     純データ+applyCommand。Three.jsをimportしない
      ↓ events
src/renderAdapter.js stateを読んでSceneへ反映（stateを書き換えない）
      ↓
Three.js Scene       固定斜視カメラ。OrbitはDebugチェックON時のみ
```

UI入力（クリック/ボタン/JSONコンソール）はすべて`dispatch(command)`に変換される。
描画側からゲームルールへの逆流はない。

## 操作（マウス/キーボード） ※Phase 2

| 操作 | マウス | キーボード |
|---|---|---|
| ユニット選択 | ユニットをクリック | Tab（味方切替） |
| 移動 | 青い到達マス(BFS/move値)をクリック | 矢印 / WASD |
| 向き決め＆待機 | 移動後、向きたい方をクリック | 十字キーで向き→Enter |
| 攻撃 | 射程内の敵をクリック | F / Space |
| ターン終了 | ボタン | E |
| 設定を開く | 右上⚙ | 閉じるEsc |

1体の行動＝**移動→向き決めクリック**（または移動後に射程内の敵をクリックで攻撃）。
味方全員が行動を終えると自動で敵ターンへ。移動・攻撃は自ターン中のみ。

## JSONコマンド

```json
{ "type": "startBattle" }
{ "type": "select",  "unitId": "ally_drake" }
{ "type": "deselect" }
{ "type": "move",    "unitId": "ally_drake", "to": { "x": 2, "y": 4 } }
{ "type": "attack",  "unitId": "ally_drake", "targetId": "enemy_golem" }
{ "type": "endTurn" }
{ "type": "motion",  "unitId": "ally_drake", "clip": "attack" }
```

moveは1マスのみ・盤外/重複は拒否。move/attackは自ターンのみ・開戦後のみ（ログに理由が出る）。
ダメージ式（暫定）は `gameState.js` の `calcDamage()` 1箇所 — 2D側の検証結果が出たらここだけ差し替える。

## テストフック

`window.CGA = { state, dispatch, screenPos(unitId) }`（読み取りとdispatchのみ。stateの直接書換は運用禁止）

## Phase 0受け入れ結果

2026-07-16 全7基準クリア → `reports/report_battle_proto_phase0_v0.1.md`
