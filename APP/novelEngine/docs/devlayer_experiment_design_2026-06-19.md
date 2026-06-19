# novelEngine DevLayer 実験設計 2026-06-19

## 目的

`C:\00_master\APP\novelEngine` 本体を直接編集せず、外側から上書き設定をかぶせる `DevLayer` の形式をnovelEngine内で先に実験する。

形式が固まったら、CreatorGameLabから選択・適用できるようにする。

## DevLayerとは

DevLayerは、Engine本体を壊さずにTitleごとの変更を持つためのJSON設定レイヤー。

素人向けに言うと、元のEngineの上に「このTitleではこのscenario、このUI、このLayoutで動かして」と書いた透明な設定シートを重ねる仕組み。

```txt
novelEngine 本体
  + DevLayer JSON
  = Titleごとの実行設定
```

## 実験スコープ

最初の実験では、次だけ扱う。

- scenario差し替え
- Title画面のボタン文言
- Novel画面のdialog位置
- fontScale
- BGM / SEの有効無効
- Android縦向けか横向けかのlayout指定

扱わないもの:

- Save / Load本実装
- AssetManager
- ScenarioManager本体
- CollectionManager
- BattleEngine連携
- 本番DB保存

## 推奨フォルダー

```txt
C:\00_master\APP\novelEngine
├─ public
│  └─ devlayers
│     └─ default.novel.devlayer.json
└─ src
   └─ devlayer
      ├─ devLayerSchema.js
      ├─ loadDevLayer.js
      └─ applyDevLayer.js
```

## DevLayer JSON案

```json
{
  "devLayerId": "default_novel_devlayer",
  "targetEngineModelId": "novel_engine_one_json_v1_1",
  "version": "0.1.0",
  "mode": "overlay",
  "layoutSheetId": "android_portrait_game",
  "uiSheetId": "novel_soft_dark",
  "overrides": {
    "scenario": {
      "mode": "replace",
      "sourcePath": "public/devlayers/scenarios/sample_scenario.json",
      "target": "scenario_main"
    },
    "titleScreen": {
      "startButtonLabel": "Start",
      "showContinueButton": false
    },
    "novelScreen": {
      "dialogueBoxPosition": "bottom",
      "fontScale": 1,
      "tapToAdvance": true
    },
    "audio": {
      "bgmEnabled": false,
      "seEnabled": false
    }
  }
}
```

## 処理の流れ

```txt
load base scenario
  -> load DevLayer
  -> apply scenario override
  -> apply UI override
  -> run GameManager
```

## applyDevLayerの責務

`applyDevLayer` は、元データを直接変更せず、実行用の合成結果を返す。

```txt
baseScenario + devLayer = runtimeScenario
baseUiConfig + devLayer = runtimeUiConfig
```

## CreatorGameLabとの関係

CreatorGameLabは、最初はDevLayerを直接編集しない。

役割:

- Engine Modelを選ぶ。
- Layout Sheetを選ぶ。
- UI Sheetを選ぶ。
- DevLayerを選ぶ。
- WorkspaceへActive Targetとして渡す。

novelEngine側は、DevLayerの形式と適用処理を先に安定させる。

## 成果物の定義

DevLayer実験の第一成果物:

```txt
public/devlayers/default.novel.devlayer.json
src/devlayer/loadDevLayer.js
src/devlayer/applyDevLayer.js
docs/devlayer_experiment_design_2026-06-19.md
```

成功条件:

- `npm run build` が通る。
- DevLayerなしでも従来のscenario_main.jsonで動く。
- DevLayerありならscenario/UI設定がruntime設定として合成される。
- Engine本体の画面構造を大きく壊していない。

## 次のTask候補

1. `public/devlayers/default.novel.devlayer.json` を作る。
2. `src/devlayer/loadDevLayer.js` を作る。
3. `src/devlayer/applyDevLayer.js` を作る。
4. `gameStore.js` にruntime scenario注入の入口を作る。
5. Build確認とReport作成。

