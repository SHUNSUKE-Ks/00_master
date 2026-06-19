# ScenarioBox

`ScenarioBox` は、CreatorHub のシナリオ試作置き場です。

## 現在の状態

まだ試作段階です。
正規DB化する前に、Markdown で企画メモ、世界観、キャラクター、scene、branch を集めます。

## 担当 agent

ScenarioBox の担当 agent は `scenarioDesigner` です。

```text
C:\00_master\Brain\CommandModules\AgentRoom\modules\scenarioDesigner
```

agent manifest:

```text
C:\00_master\Brain\CommandModules\AgentRoom\modules\scenarioDesigner\agent.json
```

## 関連 agent

ビジュアル統一は `novelDesigner` に渡します。

```text
C:\00_master\Brain\CommandModules\AgentRoom\modules\novelDesigner
```

## 関連アプリ

シナリオ実行・確認用の NovelEngine は次の場所にあります。

```text
C:\00_master\APP\novelEngine
```

移植元:

```text
C:\Users\enjoy\InBox2026\InBox0601\06_AppList\solidjs-novel-engine-01-short-schema
```

## 使い方

1. このフォルダーに企画メモを置く
2. `scenarioDesigner` が scenario brief に整える
3. scene / beat / branch / visual handoff に分ける
4. 必要になったらカンバンへ task として送る

## 推奨ファイル名

```text
YYYY-MM-DD_topic_scenario-brief.md
YYYY-MM-DD_topic_scene-breakdown.md
YYYY-MM-DD_topic_visual-handoff.md
```
