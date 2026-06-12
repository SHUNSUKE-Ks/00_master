# solidjs-novel-engine-01-short-schema

SolidJS + Vite で作る OneJson NovelEngine Vol1.1 の短編スキーマ確認用プロジェクトです。

## 司令塔室での位置づけ

この移植版は `C:\00_master\APP\novelEngine` に置き、`CreatorHub\ScenarioBox` のシナリオ試作を確認するための専用 NovelEngine として扱います。

関連:

```text
C:\00_master\CreatorHub\ScenarioBox
C:\00_master\Brain\CommandModules\AgentRoom\modules\scenarioDesigner
C:\00_master\Brain\CommandModules\AgentRoom\modules\novelDesigner
```

## 目的

`src/data/scenario/scenario_main.json` を一枚差し替えるだけで、タイトルから読了画面まで読めることを確認します。

```txt
JSON -> State -> Screen -> Click -> End
```

## 起動

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5177
```

## 主要ファイル

```txt
src/data/scenario/scenario_main.json
src/stores/gameStore.js
src/screens/00_GameManager/GameManager.jsx
src/screens/10_Title/TitleScreen.jsx
src/screens/20_Novel/NovelScreen.jsx
src/screens/90_End/EndScreen.jsx
src/DevStudio/
docs/scenario_delivery_schema.schema.json
```

## Vol1.1 で実装しないもの

背景、立ち絵、BGM、SE、選択肢、フラグ、セーブ、ロード、AssetManager、ScenarioManager、CollectionManager、PWA設定。
