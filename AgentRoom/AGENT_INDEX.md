# AgentRoom Agent Index

meta:
  date: 2026-06-20
  owner: codex
  status: active
  purpose: AIがAgentRoomで最初に読むAgent候補索引

## first read

AIはAgentRoomを扱う前に、この順番で読む。

1. `C:\00_master\AgentRoom\AGENT_INDEX.md`
2. `C:\00_master\AgentRoom\registry\agentroom_registry_2026-06-20.md`
3. 必要なAgent候補の個別ファイル

## roles

| id | type | name | role | status | first file |
|---|---|---|---|---|---|
| AR-001 | skill | KB Start Secretary | Kanban TaskTicketを短文形式で開始・報告する | testing | `C:\Users\enjoy\.codex\skills\kb-start-secretary\SKILL.md` |
| AR-002 | agent | Task to Workflow Architect | 完了Taskをagent / skill / workflow / schema候補へ変換する | testing | `C:\00_master\AgentRoom\experiments\AR-002_task_to_workflow_architect_2026-06-20.md` |
| CA-AGENT-001 | agent | Project to Code Assets Agent | PJを機能単位に分解し、コメント付きコード資産として保存する | testing | `C:\00_master\CodeAssets\templates\project_to_code_assets_agent_template.md` |

## division

| role | responsibility |
|---|---|
| 各アプリAgent | 現場状態、変更、詰まり、次候補をReportする |
| Kanban_June | Reportを受信し、Phase TODO / TaskTicket / Scaffold / Knowledgeへ整理する |
| AgentRoom | 本採用前のagent / skill / workflow / hook / command候補を試験する |
| CodeAssets | UI、機能、言語別スニペット、schema、実装パターンを保存する |

## current rule

- 現場Agentは、完璧な設計書ではなく事実Reportを書く。
- Kanban_Juneは、現場Reportを意味づけして資産化する。
- AgentRoomは、再利用できそうな作業を実験候補として扱う。
- Scaffoldは、Layout確認や複数Agent連携が必要な時に使う。
- Fast Runできる作業は、ScaffoldなしでTaskTicket実行してよい。

## task pull command

CreatorGameLab AgentがKanbanのTaskTicketを見る時:

```powershell
cd C:\00_master
node AgentRoom\commands\agent-task-pull.mjs --agent creator_game_lab_agent
```

TaskTicketからAgent作業を開始する時:

```powershell
cd C:\00_master
node AgentRoom\commands\agent-task-start.mjs --agent creator_game_lab_agent --ticket TT-20260619-010-novel-engine-deliverables
```

作業完了をKanbanへ報告する時:

```powershell
cd C:\00_master
node AgentRoom\commands\agent-task-complete.mjs --run <run_id> --status done --summary "作業概要" --verification "確認結果"
```

## report intake summary

各アプリAgentから来るReportは、最低限これを持つ。

```yaml
meta:
  source_app:
  date:
  agent:
  phase:
  status:
  report_type:
```

本文:

```md
## current_state
## changed
## working
## blocked
## next_candidates
## required_decision
## links
```

## add new agent

新しいAgent候補を追加するときは、以下を更新する。

1. `registry\agentroom_registry_2026-06-20.md`
2. この `AGENT_INDEX.md`
3. `experiments` または正式配置先の個別ファイル
