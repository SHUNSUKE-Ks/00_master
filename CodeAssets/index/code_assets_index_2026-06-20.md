# CodeAssets Index

meta:
  date: 2026-06-20
  owner: codex
  status: active
  purpose: AIが最初に読むコード資産索引

## asset list

| id | category | name | language | status | path | use_case |
|---|---|---|---|---|---|---|
| CA-SOLID-001 | template | SolidJS snippet template | SolidJS | active | `C:\00_master\CodeAssets\templates\code_snippet_template.md` | 新しいコード資産を登録する時 |
| CA-AGENT-001 | agent | Project to Code Assets Agent | markdown | testing | `C:\00_master\CodeAssets\templates\project_to_code_assets_agent_template.md` | PJを機能単位に分解してコメント付きコード資産化する時 |

## status

| status | meaning |
|---|---|
| candidate | 候補。まだ再利用検証前 |
| testing | 実PJで試験中 |
| active | 再利用してよい |
| deprecated | 古い。参考のみ |

## registration rule

新しいコード資産は、以下を必ず持つ。

- id
- title
- language
- category
- source_project
- use_case
- dependencies
- input
- output
- snippet_path
- status

