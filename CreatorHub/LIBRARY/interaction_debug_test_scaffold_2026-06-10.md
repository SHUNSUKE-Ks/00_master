# Interaction Debug Test Scaffold

作成日: 2026-06-10

## 目的

UIのレイアウト、ステート変更、ドラッグ&ドロップ、保存、フィルター、オーバーレイなどの挙動を、実装後に慌てて確認するのではなく、Scaffoldの設計段階でテスト番号として組み込む。

この手法は「動くかどうか」だけではなく、どこで止まったかを人間とAIが同じ番号で確認するための開発ハーネスとして扱う。

## 使うタイミング

- エラーが起きたとき
- DnD、フォーム、フィルター、モーダルなど、操作の途中状態が重要なとき
- 仕様がまだ曖昧で、画面の挙動を細かく設計したいとき
- ユーザーが手動テストし、Codexがログを読んで原因を切り分けるとき

## 基本フロー

```txt
挙動を1つ選ぶ
↓
1-1, 1-2, 1-3 のように番号を振る
↓
イベント境界にconsole.logを入れる
↓
ユーザーがブラウザで手動テストする
↓
出た番号 / 出なかった番号を照合する
↓
原因層を絞る
↓
修正後にログを削除、またはdebug flagで隠す
```

## 番号の例

```txt
[DnD 1-1] handle pointerdown
[DnD 1-2] pointer drag start
[DnD 1-3] target pointerover
[DnD 1-4] pointer drop
[DnD 1-5] store update requested
[DnD 1-6] store update applied
```

## Console Log運用

コンソールログは一時的に増えてよい。

ただし、開発が進むほどログが溢れるため、次のどちらかにする。

1. 修正完了後に削除する
2. `debugInteraction` のようなフラグで開発時だけ出す

本番や通常運用では、重要なエラー、保存失敗、同期失敗だけ残す。

## Scaffoldに入れる項目

TaskTicketやScaffold資料には、次の項目を持たせる。

```json
{
  "behavior": "Kanban card drag and drop",
  "scope": "InBoxのカードをPlanへ移動する",
  "testNumbers": ["1-1", "1-2", "1-3", "1-4", "1-5", "1-6"],
  "consolePrefix": "[DnD",
  "acceptance": [
    "カードをhandleから掴める",
    "移動中に持ち上がった表示になる",
    "移動先laneが検出される",
    "drop後にlaneIdが更新される"
  ],
  "reportTarget": "error_report"
}
```

## ユーザー手順テンプレ

```md
## 手動テスト

1. Chrome DevTools Consoleを開く
2. Consoleのフィルターに `[DnD` を入れる
3. 対象カードのDragHandleを掴む
4. InBoxからPlanへ移動する
5. Consoleに出た番号を貼る

## 期待ログ

- [ ] 1-1
- [ ] 1-2
- [ ] 1-3
- [ ] 1-4
- [ ] 1-5
- [ ] 1-6

## 出なかった番号

- 未確認
```

## 判断基準

- `1-1` が出ない: handleまたはイベント登録が届いていない
- `1-2` が出ない: drag開始条件、pointer capture、移動量しきい値を確認
- `1-3` が出ない: drop target検出、DOM座標、overlay干渉を確認
- `1-4` が出ない: pointerup/drop処理が届いていない
- `1-5` が出ない: UIイベントからstoreへの接続が切れている
- `1-6` が出ない: store更新、永続化、同期処理を確認

## Kanban_Juneでの扱い

- Scaffold Viewでは「Interaction Test Harness」として参照する
- Test検証Dashboardでは検証ticketとして扱う
- ErrorReportでは出なかった番号と原因層を保存する
- All Reportでは再利用できるテスト設計として目録化する

## 注意

この手法は、すべてを自動テストにする前の「観測可能な設計」に向いている。

UIが固まる前は、Playwrightなどの自動化よりも、番号付きログと手動確認の方が速く原因を見つけられることがある。
