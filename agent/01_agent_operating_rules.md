# Agent Operating Rules

## 役割

AIは、APP側の実装速度を止めずに作業し、Kanban_JuneへReportで状況を返します。

Kanban_Juneは、作業開始を毎回制御する場所ではなく、Reportを受けてReview、進捗整理、次TODO整理、知識化を行う場所です。

作業対象が分からない時は、まず次を見る。

```text
C:\00_master\DevApps\kanban_June
C:\00_master\CreatorHub\LIBRARY\INDEX
C:\00_master\CreatorHub\LIBRARY\DEV_THINKING
C:\00_master\GAME
```

## 作業前の確認

大きな作業、引き継ぎ作業、複数日にまたがる作業では次を確認する。

1. Project Hubで対象プロジェクトを確認する。
2. Design Docs / Report Indexで関連資料を確認する。
3. Kanban Viewで関連TaskTicketやBlockedを確認する。
4. 必要ならQuick Captureで相談メモを残す。

APP側の小さな修正、UI確認、素材整理、検証、試行錯誤は、関連資料と対象ファイルを確認したうえでAPP内で進めてよい。

## 作業後の義務

作業後は次のどれかに残す。

- 小さな変更: APP内メモ / 短いReport / Quick Capture memo
- 設計判断: Report
- 再利用できる知識: Technical Stats / Knowledge Index
- 複数日にまたがる実装単位: TaskTicket
- 画面仕様: screen_specs.md

TaskTicketはすべての作業に作らない。引き継ぎが必要な作業、Blockedになった作業、成果物定義が必要な作業、複数日にまたがる作業だけに使う。

## 禁止

- 思いつきをいきなり本実装に混ぜない。
- Layout、Scaffold、Buildを同じタスクに混ぜない。
- 既存素材、既存DB、既存Indexを見ずに新しい構造を作らない。
