# state-loop

## State構造

`src/draw/index.js` の `state` がゲーム全体の現在地。

```txt
state
  iteration
  score
  mousePos
  activePlaceableTower
  balloons[]
  towers[]
  pikes[]
  levelRouteMap
  towerTypeToConfiguration
```

## Loop構造

```txt
setInterval(iterate, 1000 / 60)

iterate:
  generateBalloons
  launchPikes
  movePikes
  moveBalloons
  hitCheck
  cleanup
  draw
```

## GameLab化メモ

SolidJSでは以下に分けると扱いやすい。

```txt
gameStore:
  wave
  enemies
  towers
  projectiles
  route

systems:
  spawnSystem
  towerSystem
  projectileSystem
  collisionSystem
  renderSystem
```

## 改善候補

- `iteration % frequency` を `deltaTime` へ変える。
- draw関数内の配置判定を純粋関数へ移す。
- entitiesにidを持たせる。
