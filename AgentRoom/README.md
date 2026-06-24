# AgentRoom

meta:
  owner: codex
  created: 2026-06-20
  status: experimental
  purpose: 本採用前のagent、skill、hooks、command、workflowを、スコープを定めて試験運用する場所

## 目的

AgentRoomは、Master全体へ入れる前の仕組みを試すための隔離エリア。

ここで扱うものは、まだ正式運用ではない。対象範囲、使う条件、成功条件、破棄条件を明記してから試す。

## 対象

- agent候補
- skill候補
- hooks候補
- command候補
- workflow候補
- prompt / start rule / report rule候補

## 基本ルール

1. いきなりMaster標準へ入れない。
2. まず `registry` に候補を登録する。
3. `experiments` に試験内容を書く。
4. `reports` に結果を残す。
5. 採用する場合だけ、正式な配置先へ移す。
6. 不採用や保留は `archive` に理由つきで残す。

## 採用判定

| 判定 | 意味 | 次 |
|---|---|---|
| Adopt | 本採用する | 正式配置先へ移す |
| Hold | 判断待ち | 条件が揃うまで保留 |
| Future | 将来候補 | 今は触らない |
| Reject | 不採用 | 理由を残してarchive |

## ディレクトリ

| path | role |
|---|---|
| `registry` | 候補一覧 |
| `experiments` | 試験スコープと実行計画 |
| `reports` | 試験結果 |
| `templates` | 記入テンプレート |
| `archive` | 保留、不採用、旧版 |

## 最初に読むもの

1. `AGENT_INDEX.md`
2. `registry/agentroom_registry_2026-06-20.md`
3. `templates/experiment_scope_template.md`
4. `templates/agent_candidate_template.md`
