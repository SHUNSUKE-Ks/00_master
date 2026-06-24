# NovelEngine TAG辞書 Workflow Skill候補

meta:
  date: 2026-06-21
  status: candidate
  source: C:\00_master\APP\novelEngine
  candidate_type: AgentSkill / Workflow / Template

## 目的

Scenario作成Chat、Note、DevStudio、NovelEngine runtimeで使うTAG辞書を共有し、シナリオ作成と演出指定のブレを減らす。

## 入力

- `novelEngine_tags.md`
- `tag_dictionary_v0_1.json`
- scenario_oneshot
- conversation_log_v0_1

## 出力

- AI向けTAG使用ルール
- 人間向け演出辞書
- DevStudio Tags欄
- Copy MD / Copy JSON
- schema / runtime実装への差分候補

## 現状

- `novelEngine_tags.md` 作成済み。
- DevStudio `Tags` 欄追加済み。
- Copy MD / Copy JSON 実装済み。
- runtimeで未実装のTAGも含むため、現段階では辞書、指示、schema補助として扱う。

## Skill化条件

- Scenario作成Chatへ同じ指示を複数回渡す。
- Noteからの断片変換時に毎回TAG辞書を参照する。
- MDとJSONの同期手順が必要になる。

## 関連資料

- C:\00_master\APP\novelEngine\docs\novelEngine_tags.md
- C:\00_master\APP\novelEngine\docs\tag_dictionary_v0_1.json
- C:\00_master\DevApps\kanban_June\docs\novel_engine_tags_dictionary_devstudio_report_2026-06-21.md

