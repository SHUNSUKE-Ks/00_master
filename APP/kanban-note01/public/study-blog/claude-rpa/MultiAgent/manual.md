# MultiAgent / ai-orchestrator 利用マニュアル

## 目的

`ai-orchestrator` は単体OSSではなく、GitHub Topicとしての **Multi-Agent Collaboration Platform**。
このノートブックでは、CreatorHub / Harness / Loop Engineering / Skill Systemを作るために、Multi-Agent設計を分解して読む。

## 何を見るか

見る対象は、特定のREADMEだけではない。
この資料では次の概念を先に固定する。

| 視点 | 見るもの |
|---|---|
| Orchestrator | 全体の目的、分解、Agent配置、完了条件 |
| Agent | Planner / Researcher / Coder / Reviewer / Writer |
| Queue | 未着手、実行中、確認中、完了、失敗 |
| Workflow | 作業の通り道、分岐、再試行、報告 |
| Memory | RAG、過去成果、仕様、Report |
| Skills | Agentが呼び出せる作業能力 |
| Tool | Git、Web、Notion、Codex、Ollama、Firebase |
| Worktree | Agentごとの安全な作業場 |

## なぜ詳しく分けるか

今後、この資料はおそらくクローンして新規プロジェクト化する。
そのため、読むだけのメモではなく、コード構造へ移し替えやすい粒度で分ける。

```txt
04_MultiAgent/
  orchestrator/
  agents/
  queue/
  workflow/
  memory/
  skills/
  tools/
  reports/
```

## CreatorHubへの置き換え

```txt
CreatorHub = Orchestrator
Harness    = Workflow Engine
Skills     = Worker Agent能力
Git/Web    = Tool
Memory     = RAG / Report / Study
Queue      = Kanban / rpaJobs / TaskTicket
```

## 初期実装の推奨

最初から完全なMulti-Agent coding platformを作らない。
まずは `Planner -> Researcher -> Topic -> Writer` の4Agentで、Git検索からStudy記事作成までを回す。

```txt
User request
-> PlannerAgent
-> ResearchAgent
-> TopicAgent
-> WriterAgent
-> Study / Report
```

CoderAgent、ReviewAgent、DeployAgentは後で追加する。

## 注意

- このノートブックは「候補棚」であり、まだ正本ではない。
- GitHub Topicの中から個別OSSを選ぶ段階が次に必要。
- Rust/Tauri/SolidJS構成は理想形。最初はNode script + local JSON/Firebaseでもよい。

