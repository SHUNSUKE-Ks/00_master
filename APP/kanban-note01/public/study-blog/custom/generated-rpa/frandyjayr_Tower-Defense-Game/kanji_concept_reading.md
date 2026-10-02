# frandyjayr/Tower-Defense-Game 漢字概念読解

対象本文: `/study-blog/generated-rpa/frandyjayr_Tower-Defense-Game/manual.md`

この記事は、RPA化した `frandyjayr/Tower-Defense-Game` 資料を複製し、読み取りの前に **漢字2〜4文字の概念Key** を置いた読解版。
英語Prefixは使わず、本文を読むための意味ラベルとして使う。

## 読解Key

```txt
骨格: エンジン利用ゲームの全体構造
画面: menu/play/endなどの状態遷移
登録: EntityやScreenをengineへ登録する処理
全態: game.dataに集まる全体状態
波管: waveの開始、敵生成、終了を管理する処理
敵路: 敵がmap pathを読んで進む仕組み
属性: towerやmissileに種類ごとの性質を持たせる
追尾: missileがtargetへ向かって移動する処理
異常: slow/burn/AOEなど敵へ残る効果
分離: GameLabへ移すときにstoreやtableへ分ける
```

---

# frandyjayr/Tower-Defense-Game

Tower Defense Game created via HTML5, JavaScript, and MelonJS

## 一言

骨格（Framework）: この資料は、MelonJSというゲームエンジン上で作られた完成ゲームの骨格を読むためのもの。

MelonJS上で作られた属性タワーディフェンス。
画面遷移、難易度別map、wave、属性tower、missile、enemy状態異常まで揃っており、完成ゲームOSSとして構造分析に向く。

## 基本情報

位置（Position）: まず、このOSSをどの学習棚に置くかを固定する。

- URL: https://github.com/frandyjayr/Tower-Defense-Game
- Genre: カジュアルゲーム
- SubGenre: タワーディフェンス
- Concept: 防衛属性盤
- Priority: A
- SourceType: 完成ゲームOSS
- 技術: HTML5 / JavaScript / Node.js / MelonJS
- 読解日: 2026-07-09

## READMEから分かる仕様

仕様（Spec）: READMEから、ゲームとして何を成立させているかを先に読む。

- easy / medium / hard の難易度。
- 10 waveを生き残る。
- towerは earth / fire / water / air。
- tower upgradeとfinal upgradeがある。
- 操作は矢印移動、Enter配置、Q/W/E/R/Tでtower選択、Pでwave開始。

## 主要ファイル

索引（Index）: ファイルを役割別に見れば、RPA記事やStudyカードへ分解しやすい。

| ファイル | 役割 |
|---|---|
| `js/game.js` | global `game.data`、resource load、pool登録、screen登録 |
| `js/screens/play.js` | PlayScreen。key bind、data reset、HUD/wave/tower manager追加 |
| `js/Enemies/wavemanager.js` | Pキーでwave開始、wave配列からenemyをspawn |
| `js/Enemies/enemy.js` | enemy移動、HP、速度低下、炎AOE、死亡処理 |
| `js/towers/towermanager.js` | Q/W/E/R/Tからspawn towerを選ぶ |
| `js/towers/towers.js` | tower本体、購入、upgrade、missile spawn |
| `js/towers/missiles.js` | missile追尾、属性collision、damage処理 |
| `js/Resources/waves.js` | 難易度別wave定義 |
| `js/Resources/maps.js` | 難易度別path定義 |

## アーキテクチャ

画面（Screen）: MelonJSのScreenObjectで、MENU、PLAY、ENDを切り替える。

```txt
game.onload
  -> video/audio init
  -> resource preload
  -> game.loaded
      -> me.pool.register(...)
      -> me.state.set(MENU/PLAY/END)
      -> me.state.change(MENU)

PlayScreen
  -> bindKeys
  -> resetData
  -> add HUD / WaveManager / TowerManager / End
```

登録（Register）: `me.pool.register` や `me.state.set` により、Entityと画面がengine側へ登録される。
小型Canvas手書き型の `dherault` よりも、ゲームエンジン利用時の分割例として読む。

## Global State

全態（Global State）: `game.data` が全体の可変状態。

```txt
health, waveNumber, score, gold
tower costs
missile damage
spawn times
screen bounds
lastPlacedTowerX/Y
gameDifficulty
waveStart
preRoundHasStarted
towerButtonPressed
towerMap
```

分離（Separation）: GameLabに移植するなら、`game.data` を `gameSessionStore` と `towerBalanceTable` に分ける。

## Wave

波管（Wave Manager）: `waveManagerEasy` は毎frame `preRoundPreparation / startRound / endRound` を実行する。

```txt
P pressed
-> maxSpawn / spawnTimeをwave配列から読む
-> waveStart=true
-> spawnTime間隔でenemy関数を実行
-> currentlySpawnedが0になったら次wave
```

変換（Convert）: `waves.js` のwaveは「enemy spawn関数の配列 + 末尾にspawn interval」という形式。
読みやすいが、dataとして扱いづらい。JSON化候補。

## Enemy

敵路（Enemy Path）: Enemyはmap pathを見て移動する。

```txt
currentMove: L/R/U/D/RD/UR...
currentX/currentY
path = game.mapEasy / Medium / Hard
```

方向（Direction）: 移動方向はpath配列の文字で決まる。角では回転演出も行う。

異常（Status Effect）: 属性攻撃によって敵の動きやダメージ状態が変化する。

- water: slow
- fire: AOE / burn
- level 5 water: 周囲へslow拡散
- level 5 fire: burn継続

## Tower / Missile

属性（Element）: TowerManagerがtower選択を担当する。

```txt
Q: AIR
W: WATER
E: FIRE
R: EARTH
T: upgrade / final upgrade
```

追尾（Homing）: Missileはtargetを持ち、毎frame位置を更新してenemyへ向かう。
命中時に属性別のdamageや状態異常を与える。

## GameLabへの転用

抽出（Extract）: このOSSから抜き出す価値が高い部品は、screen遷移、wave manager、属性tower、missile追尾、状態異常。

```txt
SolidJS:
  screen state / selected tower / DB view

PixiJS:
  entity sprite / missile / effect layer

Store:
  gameSession
  towerTable
  waveTable
  statusEffectTable
```

応用（Apply）: 完成ゲームOSSとしては少し古い書き方も含むが、「engine利用時に何をどこへ分けるか」を学ぶには十分に使える。

## この読解で使った概念Key

```txt
骨格（Framework）: エンジン利用ゲームの全体構造
位置（Position）: どの棚の資料か決める
仕様（Spec）: ゲームとして成立する条件
索引（Index）: 次に読むファイルへつなげる
画面（Screen）: menu/play/endなどの状態遷移
登録（Register）: EntityやScreenをengineへ登録する
全態（Global State）: 全体の可変状態
分離（Separation）: storeやtableへ責務を分ける
波管（Wave Manager）: waveの開始、敵生成、終了を管理する
変換（Convert）: 関数配列や実装をJSON化しやすい形へ寄せる
敵路（Enemy Path）: 敵がmap pathを読んで進む仕組み
方向（Direction）: path文字から進行方向を決める
異常（Status Effect）: slow/burn/AOEなど敵へ残る効果
属性（Element）: towerやmissileの種類ごとの性質
追尾（Homing）: missileがtargetへ向かう処理
抽出（Extract）: 再利用できる部品を抜き出す
応用（Apply）: 自分のGameLabへ使う
```
