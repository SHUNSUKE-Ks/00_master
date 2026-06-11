# 00_master 司令塔室

`C:\00_master` は、複数の作業領域・エージェント・スキル実行を束ねるための親リポジトリです。

## 現在の位置づけ

- `DevApps/kanban_June` は既存の独立した Git リポジトリとして保持します。
- この親リポジトリでは、司令塔室の設計、運用ドキュメント、連携設定、周辺ツールを管理します。
- `kanban_June` 本体の変更は、まず `DevApps/kanban_June` 側の Git で管理します。

## 次に決めること

- タスクをどの単位で agent に振り分けるか
- agent / skill / task / report のデータ構造
- `kanban_June` に表示するダッシュボードの情報源
- 親リポジトリと `kanban_June` の連携方法
