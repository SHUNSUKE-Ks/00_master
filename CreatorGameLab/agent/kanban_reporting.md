# CreatorGameLab Kanban Reporting

## 報告義務

CreatorGameLab Agentは、作業後に必ずKanban_JuneへReportを残す。

保存先:

```txt
C:\00_master\DevApps\kanban_June\docs
```

## Report固定見出し

AIが後から拾いやすいように、原則として次を使う。

```txt
meta:
summary:
actions:
decisions:
issues:
verification:
next:
links:
```

## meta例

```yaml
meta:
  date: 2026-06-19
  agent: creator_game_lab_agent
  topic: title setup view scaffold
  status: done
  target: C:\00_master\CreatorGameLab
  report_type: implementation
```

## 必須項目

- 実行したコマンド
- 追加/変更したファイル
- 確認したこと
- 未確認事項
- 次に触るべきファイル
- TaskTicketとの関係
- Kanban_Juneのどこに報告したか

## Index更新

重要なReportは次へ1行追加する。

```txt
C:\00_master\DevApps\kanban_June\docs\report_access_index_2026-06-18.md
```

## エラー時

Buildや仕様判断で詰まったら、作業を続けすぎずError Reportを残す。

```txt
{topic}_error_report_{YYYY-MM-DD}.md
```

## 報告前チェック

```powershell
git status --short -- CreatorGameLab CreatorHub\LIBRARY\DESIGN\CreatorGameLab DevApps\kanban_June\docs
```

実装した場合:

```powershell
cd C:\00_master\CreatorGameLab
npm run build
```

