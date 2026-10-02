# frandyjayr/Tower-Defense-Game

Tower Defense Game created via HTML5, JavaScript, and MelonJS

## 一言

MelonJS上で作られた属性タワーディフェンス。画面遷移、難易度別map、wave、属性tower、missile、enemy状態異常まで揃っており、完成ゲームOSSとして構造分析に向く。

## 基本情報

- URL: https://github.com/frandyjayr/Tower-Defense-Game
- Genre: カジュアルゲーム
- SubGenre: タワーディフェンス
- Concept: 防衛属性盤
- Priority: A
- SourceType: 完成ゲームOSS
- 技術: HTML5 / JavaScript / Node.js / MelonJS
- 読解日: 2026-07-09

## READMEから分かる仕様

- easy / medium / hard の難易度。
- 10 waveを生き残る。
- towerは earth / fire / water / air。
- tower upgradeとfinal upgradeがある。
- 操作は矢印移動、Enter配置、Q/W/E/R/Tでtower選択、Pでwave開始。

## 主要ファイル

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

MelonJSのEntity/Container/ScreenObjectに沿った構成。小型Canvas手書き型の `dherault` よりも、ゲームエンジン利用時の分割例として読む。

## Global State

`game.data` が全体の可変状態。

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

GameLabに移植するなら、`game.data` を `gameSessionStore` と `towerBalanceTable` に分ける。

## Wave

`waveManagerEasy` は毎frame `preRoundPreparation / startRound / endRound` を実行する。

```txt
P pressed
-> maxSpawn / spawnTimeをwave配列から読む
-> waveStart=true
-> spawnTime間隔でenemy関数を実行
-> currentlySpawnedが0になったら次wave
```

`waves.js` のwaveは「enemy spawn関数の配列 + 末尾にspawn interval」という形式。読みやすいが、dataとして扱いづらい。JSON化候補。

## Enemy

Enemyはmap pathを見て移動する。

```txt
currentMove: L/R/U/D/RD/UR...
currentX/currentY
path = game.mapEasy / Medium / Hard
```

移動方向はpath配列の文字で決まる。角では回転演出も行う。

状態異常:

- water: slow
- fire: AOE / burn
- level 5 water: 周囲へslow拡散
- level 5 fire: burn継続

## Tower / Missile

TowerManagerがtower選択を担当する。

```txt
Q: AIR
W: WATER
E: FIRE
R: EARTH
T: FINALUPGRADE
```

Towerは属性ごとにcost、spawnTime、damageを持つ。Enemyがtower rangeに入ると、spawnTime間隔でmissileを生成する。

Missileはtargetへ追尾し、collision typeで属性効果を発動する。

## RPA抽出

| 抽出したい要素 | 参考箇所 |
|---|---|
| Engine初期化 | `js/game.js` |
| 画面State | `js/screens/*.js` |
| プレイ初期化 | `js/screens/play.js` |
| Wave制御 | `js/Enemies/wavemanager.js`, `js/Resources/waves.js` |
| Enemy path移動 | `js/Enemies/enemy.js`, `js/Resources/maps.js` |
| Tower選択 | `js/towers/towermanager.js` |
| Tower upgrade | `js/towers/towers.js` |
| Missile追尾/属性 | `js/towers/missiles.js` |

## 再利用メモ

- 4属性towerと状態異常はカジュアルTDの企画にそのまま使いやすい。
- `wave配列 + spawn interval` は簡単だが、Note側DBではJSON化した方が扱いやすい。
- MelonJS Entity設計は、PixiJS/SolidJS構成へ移植する時の「役割分割」の参考になる。
- GameLabでは `EnemySystem / WaveSystem / TowerSystem / ProjectileSystem / HudSystem` に分解したい。

## 残課題

- global `game.data` が大きく、責務が集まりすぎている。
- wave定義が関数配列なので外部編集しづらい。
- tower cost/damage/spawnTimeが `game.data` に散っている。
- Engine依存が強いので、移植時はEntity lifecycleを置き換える必要がある。
