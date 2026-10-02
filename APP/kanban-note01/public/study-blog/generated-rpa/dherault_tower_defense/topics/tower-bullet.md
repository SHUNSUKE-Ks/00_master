# tower-bullet

## Tower配置

`placeTowerClick(state)` は、選択中towerがあり、配置可能ならtowerを作成する。

```txt
activePlaceableTower
activePlaceableTowerIsPlaceable
mousePos
```

Towerには `launchPikesFactory(tower)` で作った射撃関数が入る。

## Bullet生成

射撃関数は以下を行う。

1. tower typeから設定を取得
2. 発射frequencyを確認
3. 範囲内のballoonを探す
4. directionを正規化
5. pikes配列へ追加

## Hit処理

`iterate()` 内でpikeとballoonの距離を見て命中判定する。

```txt
distance(pike.position, balloon.position) < balloonSize
```

命中するとballoon strengthを減らし、pikeを削除する。

## 再利用ポイント

- tower configをDB化しやすい。
- pike/projectileは汎用弾システムへ変えやすい。
- 範囲内の最初の敵を狙うだけなので、targeting ruleを追加しやすい。
