# dherault/tower_defense 漢字概念読解

対象本文: `/study-blog/generated-rpa/dherault_tower_defense/manual.md`

この記事は、RPA化した `dherault/tower_defense` 資料を複製し、読み取りの前に **漢字2〜4文字の概念Key** を置いた読解版。
英語Prefixは使わず、本文を読むための意味ラベルとして使う。

## 読解Key

```txt
小型: 最小構成のゲームから構造を抜き出す
単態: 状態を一つのobjectに集める
反復: 毎frame同じ処理を回す
進行: 敵をprogress値で道に沿って進める
変換: progressをcanvas座標へ変える
配置: towerを置ける場所を判定する
射出: towerごとの弾生成関数を作る
命中: 弾と敵の距離から衝突を判定する
移植: SolidJS / PixiJS / State駆動へ置き換える
```

---

# dherault/tower_defense

A cool and simple tower defense game in canvas

## 一言

小型（Small）: この資料は、小さなCanvasゲームからタワーディフェンスの基本部品を抜き出すためのもの。

ReactはCanvasを置くだけで、実体は `src/draw/index.js` の単一stateと `setInterval` で回る小型タワーディフェンス。
ゲームループ、敵移動、弾生成、配置禁止判定を最短で学ぶ教材向き。

## 基本情報

位置（Position）: まず、このOSSをどの学習棚に置くかを固定する。

- URL: https://github.com/dherault/tower_defense
- Genre: カジュアルゲーム
- SubGenre: タワーディフェンス
- Concept: 防衛波制御
- Priority: A
- SourceType: 完成ゲームOSS
- 技術: React / Canvas / Vanilla JS寄り
- 読解日: 2026-07-09

## 主要ファイル

索引（Index）: ファイルを機能別に見れば、RPA記事や後続の実装カードへ分解しやすい。

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

構造（Structure）: Reactは入口だけ。ゲーム本体はCanvasと手続き型loopに寄っている。

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

単態（Single State）: React stateはほぼ使われていない。ゲームの状態は `draw/index.js` 内の `state` objectに集約されている。

SolidJSで作るなら、この `state` を `createStore` の `gameSession` として扱い、画面UIだけをSignalで薄く接続すると読みやすい。

## State

分類（Classify）: stateを目的別に分けると、移植時のstore設計に使える。

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

移植（Porting）: この構成は、SolidJSで作るなら `createStore` か単一storeへ置き換えやすい。

## Game Loop

反復（Loop）: `iterate()` がゲームの心臓。時間ごとに生成、移動、判定、削除、描画をまとめて行う。

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

周期（Tick）: 時間管理は `iteration % frequency` 型。簡単だが、frame rate依存になりやすい。
将来のGameLab向けには `deltaTime` 型へ変換したい。

## 敵移動

進行（Progress）: 敵は `balloon.progress` という1つの数値だけを持つ。
描画時に `balloonsProgressToPosition(progress, state)` が `levelRouteMap` の折れ線上の座標へ変換する。

```txt
progress: 0..levelRouteMapProgress
levelRouteMap: grid座標の折れ線
position: draw時に計算
```

変換（Mapping）: 敵ごとに複雑なpath stateを持たず、progressだけで済む。
タワーディフェンスの最小実装としてかなり良い。

## Tower / Bullet

射出（Launch）: Tower配置時に `launchPikesFactory(tower)` でtower専用の射撃関数を閉じ込める。

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

命中（Collision）: 射撃時は、範囲内の最初のballoonへ正規化directionを作り、pike配列へ追加する。
pikeは毎frame進み、距離上限か命中で削除される。

## 配置制約

配置（Placement）: `drawPlaceableTower.js` が配置可能判定も持つ。

判定（Validation）: 置けない場所は、route上のtile、既存towerとの重なり、grid外のような条件で確認する。
UI表示と判定が近い場所にあるので、小型サンプルとしては読みやすい。

## GameLabへの転用

抽出（Extract）: このOSSから抜き出す価値が高い部品は、道に沿う敵、tower配置、弾生成、wave周期。

```txt
SolidJS:
  UI / panel / button / state view

PixiJS:
  enemy sprite / tower sprite / bullet sprite / map layer

Store:
  gameSession
  entities
  towerConfig
  waveConfig
```

応用（Apply）: 月3本リリースの小型ブラウザゲームでは、まずこの程度の薄い構造で完成させ、あとからPixiJSやデータ駆動へ寄せるのがよい。

## この読解で使った概念Key

```txt
小型（Small）: 小さな実装から基本構造を学ぶ
位置（Position）: どの棚の資料か決める
索引（Index）: 次に読むファイルへつなげる
構造（Structure）: 全体の部品関係を見る
単態（Single State）: 状態を一つのobjectに集める
分類（Classify）: stateを役割別に分ける
移植（Porting）: 別技術へ置き換える視点
反復（Loop）: 毎frame処理を回す
周期（Tick）: 時間をframeやdeltaで扱う
進行（Progress）: 数値で道の上を進ませる
変換（Mapping）: 内部値を座標へ変える
射出（Launch）: towerから弾を生成する
命中（Collision）: 弾と敵の当たりを判定する
配置（Placement）: towerを置く操作
判定（Validation）: 置けるかどうか確認する
抽出（Extract）: 再利用できる部品を抜き出す
応用（Apply）: 自分のGameLabへ使う
```
