# engine-screen

## 起動

`js/game.js` がMelonJS初期化を行う。

```txt
video init
audio init
resource preload
pool register
screen register
state change MENU
```

## PlayScreen

`js/screens/play.js` がプレイ開始時の構成を作る。

```txt
onResetEvent:
  bindKeys
  resetData
  addEntities
```

## 追加Entity

```txt
HUD
WaveManager
End
TowerManager
InGameMenu
```

## GameLab化メモ

MelonJSのscreen stateは、Note_Story型なら以下に対応できる。

```txt
screen:
  title
  play
  result

phase:
  prepare
  wave
  intermission
```

画面StateとゲームPhaseを分けると、UIとゲームロジックを分離しやすい。
