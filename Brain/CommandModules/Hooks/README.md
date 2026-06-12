# Hooks

起動条件や自動反応を登録しておく場所です。

## 役割

- GitHub Issue 作成時の処理
- label 付与時の処理
- report 生成時の処理
- カンバン同期時の処理
- Codex Automation や GitHub Actions との接続点

## 構成

- `hooks.index.json`  
  hook 一覧の索引です。

- `modules/`  
  hook ごとの定義フォルダーを置きます。

