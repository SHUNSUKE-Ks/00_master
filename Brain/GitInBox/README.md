# GitInBox

GitHub 由来の受信箱です。

## 置くもの

- GitHub Issue から変換した task
- PR コメントやレビュー依頼
- GitHub Actions の実行結果
- `Codex GitHub Action` から返ってきた分類・計画・コメント案
- `repository_dispatch` など外部トリガーの記録

## 想定フロー

1. 携帯や GitHub UI から Issue を作成する
2. GitHub Actions が Issue 作成を検知する
3. Codex GitHub Action が初期分類する
4. 結果をこのフォルダーまたは GitHub コメントに残す
5. `kanban_June` が task として可視化する

