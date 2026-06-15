# C00 Master Agent

## 目的

`C:\00_master\agent` は、AIが `C:\00_master` 配下のプロジェクトを扱う前に読む入口です。

Kanban_Juneが進捗と案件管理の司令塔です。

このagentフォルダーは、報告義務、技術スタッツ、探索Index、企画から実装までの決まり事をまとめます。

## 最初に読む順番

1. `01_agent_operating_rules.md`
2. `02_report_policy.md`
3. `03_technical_stats.md`
4. `04_project_discovery_index.md`
5. `05_planning_to_scaffold_flow.md`

## 基本方針

- すべてのプロジェクト、企画、実験はKanban_Juneで見えるようにする。
- 重要な決定、設計、移植、失敗、修正はReportへ残す。
- 画面を作る前に、画像またはHTMLレイアウトで見た目と遷移を確認する。
- HTMLレイアウトが固まってからScaffold化し、TODOとTaskTicketに分解する。
- AIは作業開始前にIndexを確認し、既存資料や既存素材を探してから作業する。

