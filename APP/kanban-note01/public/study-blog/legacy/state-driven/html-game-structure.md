# HTMLゲーム構造 / 原文保管

> 作成時期: 2026-04-12 16:33
>
> 状態: 原文保管。PixiJS + 素JSを前提にした脱出ゲーム案。

## Folder構造

```text
my-game/
├ index.html
├ package.json
├ vite.config.js
├ service-worker.js
├ public/
│ ├ icons/
│ └ manifest.json
└ src/
  ├ core/
  │ ├ Game.js
  │ ├ SceneManager.js
  │ ├ AssetLoader.js
  │ └ EventDispatcher.js
  ├ engine/
  │ ├ PixiApp.js
  │ ├ Animation.js
  │ ├ EffectMapper.js
  │ └ SvgHandler.js
  ├ store/
  │ ├ GameState.js
  │ ├ AudioState.js
  │ └ PlayerState.js
  ├ AppScreens/
  │ ├ 00_GameManager/GameManager.js
  │ ├ 10_Title/TitleScreen.js
  │ ├ 20_Adventure/
  │ │ ├ AdventureScreen.js
  │ │ ├ ScenarioPlayer.js
  │ │ └ DialogueBox.js
  │ ├ 30_MainGame/MainGameScreen.js
  │ ├ 40_Result/ResultScreen.js
  │ ├ 50_Menu/MenuScreen.js
  │ ├ 100_Collection/CollectionScreen.js
  │ ├ 110_Settings/SettingsScreen.js
  │ └ 120_Shortcut/ShortcutScreen.js
  ├ components/
  │ ├ Button.js
  │ ├ ChoiceUI.js
  │ └ TextBox.js
  ├ data/
  │ ├ state/state.json
  │ ├ scenario/scenario.json
  │ ├ effects/effects.json
  │ ├ assets/assets.manifest.json
  │ └ schema/
  └ assets/
    ├ images/
    ├ bgm/
    ├ se/
    └ svg/
```

## 接続方針

```text
GameManager (司令塔)
  -> StateMachine
    -> SceneManager (画面切替)
      -> Screen (UI)
        -> ScenarioPlayer (テキスト再生)
```

SceneManagerは画面切替専用にし、ゲーム進行はGameManagerへ集約する。

## state.json 案

```json
[
  { "id": "TITLE", "type": "SCREEN", "screen": "Title", "next": "INTRO" },
  { "id": "INTRO", "type": "SCENARIO", "scenarioId": "M_01_01_01", "next": "ESCAPE_ROOM" },
  { "id": "ESCAPE_ROOM", "type": "SCREEN", "screen": "MainGame" },
  { "id": "CLEAR", "type": "SCREEN", "screen": "Result" }
]
```

## GameManager 原文案

```js
import stateData from "@/data/state/state.json"
import SceneManager from "@/core/SceneManager"

export default class GameManager {
  constructor() {
    this.currentState = null
  }

  start() {
    this.runState("TITLE")
  }

  getState(id) {
    return stateData.find((state) => state.id === id)
  }

  runState(stateId) {
    const state = this.getState(stateId)
    if (!state) return
    this.currentState = state

    switch (state.type) {
      case "SCREEN":
        SceneManager.change(state.screen)
        break
      case "SCENARIO":
        SceneManager.change("Adventure", {
          scenarioId: state.scenarioId,
          onEnd: () => state.next && this.runState(state.next),
        })
        break
    }
  }
}
```

## 脱出ゲームの拡張案

```json
{
  "id": "CHECK_DOOR",
  "type": "BRANCH",
  "flag": "hasKey",
  "true": "OPEN_DOOR",
  "false": "LOCKED_DOOR"
}
```

`GameState.flags.hasKey = true` のようにフラグを更新し、`state.json`は進行、`scenario.json`はテキスト演出へ分ける。
