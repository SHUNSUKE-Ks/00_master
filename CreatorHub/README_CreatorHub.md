# README_CreatorHub.md

# CreatorHub

制作・開発・知識資産を統合管理する個人向け制作ハブ。

---

# 目的

CreatorHubは単なるフォルダ構成ではない。

目的は、

- 制作物の管理
- 知識資産の管理
- AIへのコンテキスト供給
- プロジェクト横断検索
- Workspace切替

を統一することである。

---

# 基本思想

## フォルダ = カテゴリではない

従来

```txt
React
SolidJS
Rust
Firebase
```

のような技術分類を行っていた。

CreatorHubでは採用しない。

---

## フォルダ = モジュール

各フォルダは、

- 仕様
- 資料
- Assets
- Prompt
- Report

を含む独立したモジュールとする。

AIへはモジュール単位でパスを渡す。

---

# Root Structure

```txt
CreatorHub
 ├─APP
 ├─DEV
 ├─LIBRARY
 └─ScenarioBox
```

---

# 核フォルダーの役割

CreatorHubの直下フォルダーは、制作フロー全体を分担する核モジュールである。

| フォルダー | 役割 | 扱うもの |
| --- | --- | --- |
| APP | 実際に作る制作物・アプリ・ゲームの置き場 | アプリ本体、ゲーム本体、システム成果物、公開候補 |
| DEV | CreatorHub全体を運用するための管理領域 | Index、Workspace、Dashboard、Kanban、Report、Config |
| LIBRARY | 再利用できる知識資産・テンプレート・調査結果の置き場 | 技術メモ、設計パターン、テンプレート、MCP資料、検証レポート |
| ScenarioBox | 物語・企画・世界観・キャラクターなど創作素材の置き場 | シナリオ断片、設定資料、プロット、会話案、作品アイデア |

APPは成果物、DEVは運用メタ情報、LIBRARYは再利用知識、ScenarioBoxは創作原料を担当する。

---

# APP

制作対象を配置する。

例

```txt
APP
 ├─APP_弐音
 ├─APP_Note
 ├─GAME_魔女と騎士
 ├─GAME_聖女SRPG
 └─SYS_NovelEngine
```

APPは成果物である。

---

# LIBRARY

再利用可能な知識資産を配置する。

例

```txt
LIBRARY
 ├─NovelGame
 ├─BGMMaker
 ├─DropboxClone
 ├─HermesKanban
 ├─CreatorHub
 ├─MCP_Firebase
 ├─MCP_Figma
 └─SolidTemplate
```

LIBRARYは知識資産である。

---

# DEV

管理情報を配置する。

例

```txt
DEV
 ├─Index
 ├─Workspace
 ├─Dashboard
 ├─Kanban
 ├─Report
 └─Config
```

DEVはメタ情報であり、成果物ではない。

---

# モジュール構成

各モジュールは以下の構成を推奨する。

```txt
ModuleName
 ├─README.md
 ├─Requirement.md
 ├─ScreenDesign.md
 ├─DBSchema.json
 ├─Prompt
 ├─Assets
 └─Report
```

---

# Index System

LIBRARY直下には必ず目録を置く。

```txt
LIBRARY
 ├─00_LibraryIndex.md
```

目的

- モジュール検索
- タグ検索
- 依存関係管理
- AIへの情報提供

---

# Workspace

CreatorHubは固定構造を持つ。

監視対象はWorkspaceで切り替える。

---

例

```json
{
  "workspaceName": "Main",
  "rootPath": "C:/CreatorHub"
}
```

---

Workspace変更時は、

- APP
- LIBRARY
- DEV

の参照先を切り替える。

フォルダ移動は行わない。

---

# DevApps

CreatorHub本体と管理ツールは分離する。

例

```txt
DevApps
 ├─APP_CreatorHub
 ├─APP_HermesKanban
 ├─APP_IndexViewer
 └─APP_WorkspaceSwitcher
```

---

# CreatorHub App

将来的なTauriアプリ。

機能

- Dashboard
- Library Viewer
- Hermes Kanban
- Workspace Switcher
- Search
- Report Viewer

---

# AI運用ルール

AIへ渡す単位はフォルダではなくモジュールとする。

例

```txt
LIBRARY/NovelGame
```

または

```txt
APP/APP_弐音
```

単位で渡す。

技術別フォルダは作らない。

---

# 最重要原則

探すための分類を作らない。

AIに渡すためのモジュールを作る。

CreatorHubは制作物ではなく、制作システムそのものを管理する基盤である。

