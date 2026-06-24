# Technical Stats

## 目的

よく使う設計技術、実装型、プロジェクトセットアップ手順をAIが探せるようにまとめます。

ここはScaffold資料とは別です。

Scaffoldは、決まった設計をファイル、TODO、console prefixへ分解する工程です。

TaskTicketは、複数日にまたがる作業、引き継ぎが必要な作業、Blocked、成果物定義が必要な作業だけに使います。

Technical Statsは、繰り返し使う技術パターンの目録です。

## 登録済み

### SolidState

SolidJSで画面を作る時の基本スタック。

現時点の前提:

```text
SolidJS
Vite
TypeScript
lucide-solid
CSS Modulesではなく通常CSS中心
localStorageによる初期永続化
必要に応じてFirebase連携
```

今後、Templateごとのセットアップコマンドを作る。

候補:

```powershell
npm create vite@latest {project-name} -- --template solid-ts
cd {project-name}
npm install
npm install lucide-solid
npm run dev -- --host 127.0.0.1 --port {port}
```

### View State Layering

画面状態レイヤー分割。

場所:

```text
C:\00_master\CreatorHub\LIBRARY\DEV_THINKING\CreatorGameLab\05_view_state_layering.md
```

画面内の現在状態を次に分ける。

```text
App Phase
View Phase
Active Target
View Mode
Interaction State
Overlay State
```

### Scaffold / TaskTicket

場所:

```text
C:\Users\enjoy\Dropbox\00_secretary\docs\ClaudeCodeBook\scaffold
C:\00_master\CreatorHub\LIBRARY\DEV_THINKING\CreatorGameLab\03_scaffold_to_taskticket_flow.md
```

HTMLレイアウトと仕様が固まってから、ファイル構成、TODO、console prefixに分解する。

必要な場合だけTaskTicketに分ける。

## 今後作るTemplate

- SolidState App Template
- NovelGame Workspace Template
- CreatorGameLab ScreenLayout Template
- Kanban Report Template
- Scaffold TaskTicket Template
