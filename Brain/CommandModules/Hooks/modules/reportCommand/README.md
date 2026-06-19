# Report コマンド

## Trigger

```text
Report
```

ユーザーが `Report` と入力したら、直前または指定された作業について、下の形式で報告を作成する。

## Output Target

優先保存先:

```text
C:\00_master\DevApps\kanban_June\docs
```

Report索引:

```text
C:\00_master\DevApps\kanban_June\docs\report_access_index_2026-06-18.md
```

agent の作業ログ・調査ログとして残す場合:

```text
C:\00_master\Brain\Reports
```

分類前のメモとして受ける場合:

```text
C:\00_master\Brain\Inbox
```

## Filename Rule

```text
YYYY-MM-DD_agent-topic_report.md
```

例:

```text
2026-06-18_codex-report-command_report.md
```

## Report Format

```md
# Report

meta:
  date: YYYY-MM-DD
  agent: codex
  topic: short-topic
  status: done | partial | blocked | failed
  target: C:\absolute\path
  report_type: implementation | research | review | test | error | handoff

summary:
- 1行で何をしたか
- 重要な結果
- 次に見るべき場所

actions:
- action: 実施内容
  files:
  - C:\absolute\path
  result: 結果

decisions:
- decision: 決めたこと
  reason: 理由

issues:
- issue: 問題または未解決点
  impact: 影響
  next: 次の対応

verification:
- check: 確認内容
  result: pass | fail | not_run
  note: 補足

next:
- 次の作業

links:
- C:\absolute\path
```

## Rules

- 見出し名は固定する。
- 長い背景説明を避け、検索できる語と絶対パスを入れる。
- `summary` は最大3行。
- `actions` は実際に行ったことだけを書く。
- `issues` がなければ `issues: []` と書く。
- `verification` を実行していなければ `result: not_run` と書く。
- 新しいReportを作成したら、必要に応じて `report_access_index_2026-06-18.md` に1行追加する。
- 保存後、ユーザーには保存先と要点だけ返す。
