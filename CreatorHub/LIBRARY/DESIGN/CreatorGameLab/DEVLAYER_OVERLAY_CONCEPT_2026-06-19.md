# CreatorGameLab DevLayer Overlay Concept

## 結論

`C:\00_master\APP\novelEngine` は、CreatorGameLabのEngine Model第一号として使える。

理由:

- SolidJS + Viteで、CreatorGameLabと技術的に近い。
- `scenario_main.json` を差し替えて動かす目的が明確。
- One JSON NovelEngine Vol1.1として範囲が小さく、最初のmodelに向いている。

## 用語

### Engine

大分類。

例:

```txt
AdventureEngine
BattleEngine
CollectionEngine
```

### Engine Model

Engineの中の具体的な実装パターン。

例:

```txt
novel_engine_one_json_v1_1
```

対応元:

```txt
C:\00_master\APP\novelEngine
```

### DevLayer

Engine本体を直接編集せず、CreatorGameLab側から上にかぶせる設定レイヤー。

素人向けに言うと、元のアプリを壊さずに、上から「このTitleではこの表示、このScenario、このボタン名、この音設定で動かして」と指示するJSON。

## なぜ直接編集しないか

`C:\00_master\APP\novelEngine` を直接編集すると、次の問題が起きる。

- Engine本体とTitle固有変更が混ざる。
- どのTitleのための変更か分からなくなる。
- Engine Modelのversion比較が難しくなる。
- 後から別Titleに使い回しにくくなる。

そのため、Engine本体はなるべく固定し、Titleごとの変更はDevLayer JSONへ逃がす。

## DevLayerの考え方

```txt
Engine Model
  C:\00_master\APP\novelEngine

DevLayer
  Titleごとの上書きJSON

Runtime / Adapter
  Engine Model + DevLayer を合成してWorkspaceで確認
```

## DevLayer JSON例

```json
{
  "devLayerId": "devlayer_novel_engine_one_json_v1_1_default",
  "targetEngineModelId": "novel_engine_one_json_v1_1",
  "targetSourcePath": "C:/00_master/APP/novelEngine",
  "mode": "overlay",
  "overrides": {
    "scenario": {
      "targetFile": "src/data/scenario/scenario_main.json",
      "activeScenarioId": "sample_title_scenario"
    },
    "ui": {
      "titleScreen": {
        "startButtonLabel": "Start"
      },
      "novelScreen": {
        "dialogueBoxPosition": "bottom",
        "fontScale": 1
      }
    }
  }
}
```

## できること

- TitleごとにScenario JSONを差し替える。
- UIの表示密度やボタン文言を変える。
- Android縦/横Layout Profileに合わせた値を持つ。
- Engine本体を壊さず、Titleごとの試作を増やす。

## まだできないこと

2026-06-19時点では、DevLayer JSONを実際にnovelEngineへ自動反映するAdapterは未実装。

まだ必要なもの:

1. `DevLayer` schema
2. `EngineModelAdapter`
3. `Workspace` で Engine Model + DevLayer を読む仕組み
4. novelEngine側へ渡す方法
5. 生成/同期されたscenario JSONの保存先

## 次の一手

まずは `novel_engine_one_json_v1_1` をAdventureEngineのModel第一号として登録する。

次に、Titleごとに次を持たせる。

```txt
engineSlots.adventure.modelId = novel_engine_one_json_v1_1
devLayerId = devlayer_novel_engine_one_json_v1_1_default
layoutProfileId = android_portrait_standard
```

その後、`TitleSetupView` でEngine Model、Layout Profile、DevLayerを選べるようにする。
