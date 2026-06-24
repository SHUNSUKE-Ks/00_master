# Note to DevStudio Scenario Fragment 連携 Skill候補

meta:
  date: 2026-06-21
  status: candidate
  source: C:\00_master\APP\kanban-note01
  target: C:\00_master\APP\novelEngine
  candidate_type: AgentSkill / Workflow

## 目的

Note / kanban-note01 で書いた会話ログ、ページ本文、シナリオ断片を、NovelEngine DevStudioへ送る作業を定型化する。

## 入力

- Note本文
- Notebook page本文
- conversation_log_v0_1形式の会話ログ
- 送信先target: `novelEngine`
- type: `scenario_fragment`

## 出力

- Firebase `memoArchive` への送信
- `status: inbox`
- DevStudio側の受信表示候補
- scenario_oneshot変換候補

## 現状

- kanban-note01側の送信機能は実装済み。
- NovelEngine DevStudio側の受信表示は未実装。
- 送信後statusの読み取り、accepted / needs_fix / converted 等の更新は未実装。

## Skill化条件

- NoteからDevStudioへの送信を2回以上使う。
- DevStudio側で受信、変換、採用、修正依頼の流れが固定化する。
- Firebase payload schemaが安定する。

## 関連資料

- C:\00_master\DevApps\kanban_June\docs\kanban_note01_devstudio_scenario_fragment_send_report_2026-06-21.md
- C:\00_master\APP\novelEngine\docs\conversation_log_draft_format_v0_1.md
- C:\00_master\APP\novelEngine\docs\scenario_oneshot.schema.json

