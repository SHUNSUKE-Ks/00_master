# novelEngine 移植メモ

## 移植元

```text
C:\Users\enjoy\InBox2026\InBox0601\06_AppList\solidjs-novel-engine-01-short-schema
```

## 移植先

```text
C:\00_master\APP\novelEngine
```

## 現在の位置づけ

このアプリは、`CreatorHub\ScenarioBox` で試作したシナリオを実行・確認するための専用 NovelEngine です。

短編シナリオ用の JSON schema を中心に、Title、Novel、End の画面遷移と素材表示を検証します。

## 関連 agent

- `scenarioDesigner`  
  シナリオ brief、scene、branch、visual handoff を作る担当です。

- `novelDesigner`  
  画風、Character、背景、アイテム、Titleロゴ、Title背景のスタイル統一を担当します。

## 運用

```text
ScenarioBox
  ↓ scenarioDesigner
scenario_main.json / scenario delivery schema
  ↓
APP\novelEngine
  ↓
画面確認・演出確認
```

