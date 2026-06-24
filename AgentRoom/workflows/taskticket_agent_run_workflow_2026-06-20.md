# TaskTicket Agent Run Workflow

meta:
  date: 2026-06-20
  owner: codex
  status: testing
  purpose: TaskTicketからAgent作業開始、作業ログ、Kanban報告までをコマンドで動かす

## command flow

1. Pull candidate

```powershell
cd C:\00_master
node AgentRoom\commands\agent-task-pull.mjs --agent creator_game_lab_agent
```

2. Start run

```powershell
cd C:\00_master
node AgentRoom\commands\agent-task-start.mjs --agent creator_game_lab_agent
```

特定TaskTicketを始める場合:

```powershell
cd C:\00_master
node AgentRoom\commands\agent-task-start.mjs --agent creator_game_lab_agent --ticket TT-20260619-010-novel-engine-deliverables
```

3. Work

出力されたPromptをCodex CLIまたはDesktop Chatへ渡して作業する。

4. Complete

```powershell
cd C:\00_master
node AgentRoom\commands\agent-task-complete.mjs --run <run_id> --status done --summary "作業概要" --verification "確認結果"
```

## generated files

| folder | role |
|---|---|
| `AgentRoom\runs` | AgentRun JSON |
| `AgentRoom\prompts` | Codexへ渡す開始Prompt |
| `AgentRoom\logs` | 作業ログMarkdown |
| `DevApps\kanban_June\docs` | TaskTicket単位のKanban報告 |

## current limitation

- Kanban UIのlocalStorage状態はまだ直接更新しない。
- TaskTicketを`doing/done`へ移動するのはKanban UIまたは後続の同期コマンドで行う。
- まずは「再開できるログ」と「TaskTicket単位Report」を残すことを優先する。

## first verification

2026-06-20にCreatorGameLab Agentで開始から完了まで試験した。

```text
run: run_creator_game_lab_agent_TT-20260619-010-novel-engine-deliverables_20260620T015640Z
task: TT-20260619-010-novel-engine-deliverables
status: done
```

生成物:

- `C:\00_master\AgentRoom\runs\run_creator_game_lab_agent_TT-20260619-010-novel-engine-deliverables_20260620T015640Z.json`
- `C:\00_master\AgentRoom\prompts\run_creator_game_lab_agent_TT-20260619-010-novel-engine-deliverables_20260620T015640Z.md`
- `C:\00_master\AgentRoom\logs\run_creator_game_lab_agent_TT-20260619-010-novel-engine-deliverables_20260620T015640Z.md`
- `C:\00_master\DevApps\kanban_June\docs\tt-20260619-010-novel-engine-deliverables_creator_game_lab_agent_report_2026-06-20.md`

確認結果:

- `agent-task-start` でRun JSON / Prompt / Logを保存できた。
- `agent-task-complete` でKanban docsへTaskTicket単位Reportを保存できた。
