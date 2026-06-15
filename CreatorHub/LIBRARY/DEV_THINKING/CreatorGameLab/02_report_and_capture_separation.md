# Codex Inbox / Report / 資料の分離

## 分ける理由

Codex Inbox、Report、資料は役割が違います。

```txt
Codex Inbox
  未整理メモ、相談、外部入力

Reports
  決定、調査、設計、作業結果

Design Docs
  仕様、画面構成、Scaffold、TaskTicket化前の資料
```

## Quick Capture

Quick Captureは常時大きく表示しません。

必要な時だけ右オーバーレイサイドバーとして開き、対象ファイルを指定して書けるようにします。

保存先の候補:

- memo
- report-note
- task-draft

## Report表示

Reportはカンバン式に縛らず、読み物として見ます。

望ましいUI:

- 左: Project / Category フィルタ
- 中央: Report一覧
- 右: Report詳細プレビュー
- 右Overlay: Quick Capture

