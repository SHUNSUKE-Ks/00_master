# overview

## 何の資料か

`dherault/tower_defense` を、ブラウザカジュアルゲーム制作の参考として読むためのRPA資料。

## 要点

- Reactはcanvasの設置だけ。
- 実ゲームは `src/draw/index.js` に集約。
- 単一state objectで入力、敵、tower、弾、routeを持つ。
- `setInterval` で60fps相当のloopを回す。
- 敵はroute上の `progress` から座標を計算する。

## 学べること

| 学習 | 内容 |
|---|---|
| 最小Loop | generate / move / collision / draw |
| Route | grid折れ線をprogress移動へ変換 |
| Tower | 配置、範囲、発射間隔、弾生成 |
| Placement | route禁止、tower重なり禁止 |

## 注意

実装は小さいが、責務分離は弱い。教材として読み、再利用時はstate/update/draw/inputへ分ける。
