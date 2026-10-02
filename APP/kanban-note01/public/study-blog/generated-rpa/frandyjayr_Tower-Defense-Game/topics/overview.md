# overview

## 何の資料か

`frandyjayr/Tower-Defense-Game` を、完成タワーディフェンスOSSとして読むためのRPA資料。

## 要点

- MelonJSのScreenObject / Entity / Containerを使う。
- `game.data` にセッション状態とバランス値が集まる。
- PlayScreenがkey bind、data reset、entity配置を担当する。
- WaveManagerがPキー開始、wave spawn、wave終了を管理する。
- TowerManagerがQ/W/E/R/Tからtowerまたはupgradeを選ぶ。
- Missileがtarget追尾し、属性ごとの効果をEnemyへ与える。

## 学べること

| 学習 | 内容 |
|---|---|
| Engine構成 | init / preload / pool / state |
| 画面遷移 | MENU / PLAY / END |
| Wave | 難易度別waveとspawn interval |
| 属性Tower | air / water / fire / earth |
| 状態異常 | slow / AOE / burn |

## 注意

直接移植するより、役割分解してSolidJS + PixiJS向けに再設計するのがよい。
