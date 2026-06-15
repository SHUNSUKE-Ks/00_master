# 左サイドバー情報設計

## 方針

今ある画面は消さず、初期表示だけ絞ります。

制作環境が変わってきたため、左サイドバーは「よく使う入口」と「必要な時だけ出す旧機能」に分けます。

## 初期表示のおすすめ順

```txt
1. Project Hub
2. Codex Inbox
3. Reports
4. Design Docs
5. Kanban
```

## 非表示にしてSettingsから戻せるもの

```txt
Dashboard
Dashboards
Cycle
Scaffold
Tickets
All Report
List
Database
```

## 理由

- `Project Hub`: 今抱えているプロジェクト全体を見る入口。
- `Codex Inbox`: 相談、メモ、未整理入力の入口。
- `Reports`: 決定・設計・調査結果を見る入口。
- `Design Docs`: screenLayout、仕様書、Scaffold資料を見る入口。
- `Kanban`: 実作業に落としたタスクを見る入口。

Reportと資料をカンバンに混ぜないことで、作業進行と知識確認を分けます。

