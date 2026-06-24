# Report Policy

## 報告場所

メインの報告場所:

```text
C:\00_master\DevApps\kanban_June\docs
```

制作ライブラリやゲーム設計に近い資料:

```text
C:\00_master\CreatorHub\LIBRARY\DOCS
C:\00_master\CreatorHub\LIBRARY\DESIGN
C:\00_master\GAME
```

## 報告が必要なもの

- 新しいプロジェクト開始
- 画面構成の決定
- DBやSchemaの決定
- 素材発注方針
- 既存アプリからの移植判断
- エラーと修正
- 次のChatへ渡す引継ぎ
- 技術スタッツへの登録

## APP-first運用

APP側の細かい実装、検証、UI確認、素材整理、試行錯誤は、毎回TaskTicket化しなくてよい。

作業後に短いReportを残し、Kanban_June側でReview、進捗整理、次TODO整理、知識化を行う。

TaskTicketは、複数日にまたがる作業、引き継ぎが必要な作業、Blockedになった作業、成果物定義が必要な作業だけに使う。

## Reportファイル名

```text
{topic}_{type}_{YYYY-MM-DD}.md
```

例:

```text
creator_game_lab_start_report_2026-06-15.md
view_state_layering_technical_stat_2026-06-15.md
```

## Reportフォーマット

```md
# タイトル

## 概要

何を決めたか。

## 背景

なぜ必要になったか。

## 決定

- 決定1
- 決定2

## 影響範囲

- Project
- File
- DB
- UI

## 次の作業

- 次にやること

## 関連ファイル

- `C:\...`
```
