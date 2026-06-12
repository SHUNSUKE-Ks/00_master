# CommandModules

司令塔室の実行モジュールをまとめる場所です。

## 目的

`Brain` 直下に agent、skill、hook が散らばると、資料棚と実行系の境界が曖昧になります。
そのため、実行に関わる module 群はこのフォルダーに集約します。

## フォルダー

- `AgentRoom/`  
  agent の担当、状態、利用 skill を管理します。

- `SkillsLibrary/`  
  agent が使う手順・能力・prompt を管理します。

- `Hooks/`  
  GitHub Issue、label、report、automation などの起動条件を管理します。

- `ModuleRegistry/`  
  agent / skill / hook の version、依存関係、有効セットを横断管理します。

## 使い分け

```text
AgentRoom = 誰がやるか
SkillsLibrary = どうやるか
Hooks = いつ起動するか
ModuleRegistry = 今どの版を使うか
```
