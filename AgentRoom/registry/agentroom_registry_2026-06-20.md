# AgentRoom Registry

meta:
  date: 2026-06-20
  owner: codex
  status: active
  purpose: 本採用前のagent / skill / hooks / command / workflow候補一覧

## registry

| id | type | name | scope | status | path | note |
|---|---|---|---|---|---|---|
| AR-001 | skill | kb-start-secretary | Kanban_JuneのTaskTicket開始秘書 | testing | `C:\Users\enjoy\.codex\skills\kb-start-secretary` | `/KB_START` の短文報告、担当、進捗、Issue回収ルール |
| AR-002 | agent | Task to Workflow Architect | 完了Taskをagent / skill / workflow / schema候補へ変換する | testing | `C:\00_master\AgentRoom\experiments\AR-002_task_to_workflow_architect_2026-06-20.md` | 成果物の明記、再現性判定、schema化判断を担当 |
| CA-AGENT-001 | agent | Project to Code Assets Agent | PJを機能単位に分解し、コメント付きコード資産として保存する | testing | `C:\00_master\CodeAssets\templates\project_to_code_assets_agent_template.md` | CodeAssetsへUI、機能、状態、CSS、schemaを登録する |

## status rule

| status | meaning |
|---|---|
| idea | まだ構想 |
| testing | AgentRoomで試験中 |
| hold | 判断待ち |
| adopted | 本採用済み |
| rejected | 不採用 |

## 登録時に必要な項目

- id
- type
- name
- scope
- owner
- expected input
- expected output
- success condition
- risk
- adoption target
