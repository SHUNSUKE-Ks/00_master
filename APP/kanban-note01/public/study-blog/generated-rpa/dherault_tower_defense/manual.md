# dherault/tower_defense

A cool and simple tower defense game in canvas

## 一言

ReactはCanvasを置くだけで、実体は `src/draw/index.js` の単一stateと `setInterval` で回る小型タワーディフェンス。ゲームループ、敵移動、弾生成、配置禁止判定を最短で学ぶ教材向き。

## 基本情報

- URL: https://github.com/dherault/tower_defense
- Genre: カジュアルゲーム
- SubGenre: タワーディフェンス
- Concept: 防衛波制御
- Priority: A
- SourceType: 完成ゲームOSS
- 技術: React / Canvas / Vanilla JS寄り
- 読解日: 2026-07-09

## 主要ファイル

| ファイル | 役割 |
|---|---|
| `src/App.js` | React component。canvas refを作り、mount時に `run(canvas)` を呼ぶだけ |
| `src/draw/index.js` | game state、route生成、balloon生成、draw、iterateを一括管理 |
| `src/events/placeTowerClick.js` | tower配置と、towerごとの弾生成関数を作る |
| `src/events/towerButtonClick.js` | command領域のtower選択ボタン |
| `src/draw/drawBalloons.js` | progress値をroute上の座標へ変換して敵を描画 |
| `src/draw/drawPlaceableTower.js` | 配置プレビュー、禁止タイル、既存towerとの重なり判定 |
| `src/draw/drawPikes.js` | 弾を小円で描画 |

## 構造

```txt
React App
  -> canvas
  -> run(canvas)
      -> state
      -> mouse/click event
      -> draw()
      -> iterate()
      -> setInterval(iterate, 1000 / 60)
```

React stateはほぼ使われていない。ゲームの状態は `draw/index.js` 内の `state` objectに集約されている。

## State

```txt
Main:
  iteration, score, outBalloonsCount

Input:
  mousePos, isCanvasHovered, activePlaceableTower

World:
  gridCellSize, gridWidth, gridHeight
  levelRouteMap, levelRouteMapTiles, levelRouteMapProgress

Entities:
  balloons[]
  towers[]
  pikes[]

Config:
  towerTypeToConfiguration
```

この構成は、SolidJSで作るなら `createStore` か単一storeへ置き換えやすい。

## Game Loop

`iterate()` がゲームの心臓。

```txt
generateBalloons
-> towers.forEach(launchPikes)
-> pikes move
-> balloons move
-> collision check
-> remove dead/out objects
-> draw
-> iteration++
```

時間管理は `iteration % frequency` 型。簡単だが、frame rate依存になりやすい。将来のGameLab向けには `deltaTime` 型へ変換したい。

## 敵移動

敵は `balloon.progress` という1つの数値だけを持つ。描画時に `balloonsProgressToPosition(progress, state)` が `levelRouteMap` の折れ線上の座標へ変換する。

```txt
progress: 0..levelRouteMapProgress
levelRouteMap: grid座標の折れ線
position: draw時に計算
```

これはタワーディフェンスの最小実装としてかなり良い。敵ごとに複雑なpath stateを持たず、progressだけで済む。

## Tower / Bullet

Tower配置時に `launchPikesFactory(tower)` でtower専用の射撃関数を閉じ込める。

```txt
tower
  type
  position
  launchPikes(state)

pike
  tower
  position
  direction
```

射撃時は、範囲内の最初のballoonへ正規化directionを作り、pike配列へ追加する。pikeは毎frame進み、距離上限か命中で削除される。

## 配置制約

`drawPlaceableTower.js` が配置可能判定も持つ。

- route tileの周辺は配置不可
- 他towerの半径と重なる場合は配置不可
- 置けない時はプレビュー色を赤にする

描画関数が判定も更新しているので、厳密には責務が混ざっている。再利用時は `canPlaceTower(state, mousePos)` と `drawPlacementPreview()` に分けたい。

## RPA抽出

| 抽出したい要素 | 参考箇所 |
|---|---|
| Canvas game loop | `src/draw/index.js` |
| route progress移動 | `src/draw/drawBalloons.js` |
| tower配置禁止判定 | `src/draw/drawPlaceableTower.js` |
| tower factory / bullet生成 | `src/events/placeTowerClick.js` |
| command button | `src/events/towerButtonClick.js` |

## 再利用メモ

- 月産ブラウザゲーム用の「最小TD教材」として良い。
- SolidJS側ではCanvas描画だけをimperativeにし、UI/設定/ステージ選択をSolid stateで持つのが向く。
- `progress -> route position` はSRPGの経路移動、オートバトルの敵進行にも転用できる。
- `towerTypeToConfiguration` は後でDB化しやすい。

## 残課題

- READMEがCreate React Appテンプレートのままで、ゲーム仕様がREADMEから読めない。
- waveは固定10体だけで、拡張性は薄い。
- collisionは総当たりに近いので、大量敵には不向き。
- draw関数がstate更新も行う箇所がある。
