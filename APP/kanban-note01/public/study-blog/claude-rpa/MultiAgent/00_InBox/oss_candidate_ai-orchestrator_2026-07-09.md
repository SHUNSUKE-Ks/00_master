# OSS候補: ai-orchestrator

Multi-Agent Collaboration Platform

## 基本情報

- URL: https://github.com/topics/ai-orchestrator
- Title(原題): Multi-Agent Collaboration Platform
- 概念: 群体制御
- 発見日: 2026-07-09
- star数 / 主要言語 / 規模(KB): Topic索引 / mixed / topic
- 分類: 04_MultiAgent
- 用途: Orchestrator / Harness / Loop Engineering / Skill Systemの設計候補

## Dict

| 用語 | 定義 |
|---|---|
| Orchestrator | 全体の目的、作業順、Agent分担、完了条件を管理する司令塔 |
| Worker Agent | 分配された具体タスクを実行する担当Agent |
| Task Queue | 未着手、実行中、確認中、完了などの状態を持つ作業待機列 |
| Collaboration | 複数Agentが役割を分け、成果物を統合する協調処理 |
| Workflow | 作業の入口、分岐、実行、確認、報告までの経路 |
| Planner | 目的を分解し、Taskを作るAgent |
| Researcher | Git/Web/資料を調べ、候補と根拠を集めるAgent |
| Coder | 実装、修正、テスト追加を担当するAgent |
| Reviewer | 成果物を検証し、漏れや危険を見つけるAgent |
| Memory | RAGや履歴から再利用可能な情報を保持する記憶庫 |
| Worktree | AgentごとにGit作業場を分けるための分岐作業ディレクトリ |

## ファイル名候補

- 提案フォルダ名: `01_Library/MultiAgent/`
- Note側保存先: `public/study-blog/claude-rpa/MultiAgent/`
- 参考: OpenHarnessの型は `manual.md` + `目次.md` + `topics/*.md`

## 一言評価

- 単体OSSではなく、複数AIをどう指揮するかのGitHub Topic。
- CreatorHub / Harness / Skills / Queue / Memory / Workflowの次段階設計に直結する。
- Rust + Tauri + SolidJSでローカルOrchestrator UIを作る場合の上位設計候補。

## 関連しそうな既存資料

- `public/study-blog/claude-rpa/OpenHarness/`
- `public/study-blog/claude-rpa/agent-skills-for-context-engineering/`
- `public/study-blog/claude-rpa/awesome-harness-engineering/`
- `public/study-blog/novel-engine/`
- `C:\00_master\CreatorHub`

