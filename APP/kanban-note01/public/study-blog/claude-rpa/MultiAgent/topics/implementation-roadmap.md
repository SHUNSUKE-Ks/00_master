# implementation-roadmap: 実装ロードマップ

## Phase 1: Study内Library化

今回の作業。

```txt
MultiAgent/
  00_InBox/
  manual.md
  目次.md
  topics/
```

目的は、Topicを読む入口を作ること。

## Phase 2: Queueを読むCodexコマンド

`rpaJobs` と同じように、MultiAgent用のjobを読む。

```txt
multiAgentJobs
  status: 実行依頼
  target: Planner / Research / Writer
  source: Study / InBox / Kanban
```

## Phase 3: 4Agent構成

最初の実装候補。

```txt
PlannerAgent
ResearchAgent
TopicAgent
WriterAgent
```

出力はStudyノートブックとKanban Report。

## Phase 4: Coder / Reviewer追加

資料化が安定してから、コード編集Agentを追加する。

```txt
CoderAgent
ReviewAgent
DeployAgent
```

この段階でGit Worktreeを検討する。

## Phase 5: Tauri化

Rust / Tauri / SolidJSでローカルOrchestrator UIを作る。

```txt
Task Queue
Agent Dashboard
Workflow View
Memory View
Report View
```

## 最初の推奨タスク

1. MultiAgent Studyノートブックを読み込めるようにする。
2. OSS候補DBへ `ai-orchestrator` を追加する。
3. Kanbanへ今回の資料追加を報告する。
4. 次に個別OSS候補を3件ほど選び、OpenHarness方式でLibrary化する。

