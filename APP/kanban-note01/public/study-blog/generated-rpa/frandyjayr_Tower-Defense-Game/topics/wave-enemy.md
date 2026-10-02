# wave-enemy

## WaveManager

WaveManagerは毎frame以下を呼ぶ。

```txt
preRoundPreparation
startRound
endRound
```

Pキーでwaveが開始される。

```txt
P pressed
currentlySpawned == 0
towerButtonPressed == false
-> waveStart = true
```

## Wave定義

`js/Resources/waves.js` に難易度別wave配列がある。

```txt
game.waveEasy
game.waveMedium
game.waveHard
```

各waveは「enemy生成関数の配列」で、末尾にspawn intervalが入る。

## Enemy移動

Enemyは `game.mapEasy / game.mapMedium / game.mapHard` からpathを選ぶ。

```txt
currentMove = path[currentY][currentX]
```

移動文字:

```txt
L/R/U/D
RD/UR/RU/DR/LD/UL/LU/DL
```

## GameLab化メモ

wave定義は関数配列ではなく、JSON化すると編集しやすい。

```json
{
  "wave": 1,
  "spawnInterval": 0.6,
  "enemies": [
    { "type": "soldier", "count": 10 }
  ]
}
```
