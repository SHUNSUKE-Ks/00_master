# tower-missile

## TowerManager

TowerManagerはtower選択と資金不足表示を担当する。

```txt
Q: AIR
W: WATER
E: FIRE
R: EARTH
T: FINALUPGRADE
ESC/ENTER: cancel/confirm
```

wave中はtower選択できない。

## Tower

Towerは属性ごとの値を持つ。

```txt
elementType
towerCost
spawnTime
missileDamage
towerLevel
```

upgradeはlevel 1から4、final upgradeでlevel 5。

## Missile

Missileはtargetへ追尾する。

```txt
getTarget
calculateDirection
changeMissilePosition
collision
```

属性効果:

- WATER: slow
- FIRE: AOE / burn
- AIR: 将来拡張用
- EARTH: 高damage系

## GameLab化メモ

Tower / Missile / Enemy effectを分ける。

```txt
TowerSystem
ProjectileSystem
EffectSystem
BalanceTable
```

これにすると、Note側DBでtower性能表を編集しやすくなる。
