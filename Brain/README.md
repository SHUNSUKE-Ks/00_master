# Brain

`Brain` は、司令塔室が参照する知識・受信物・報告・技術情報を集める場所です。

## フォルダー

- `GitInBox/`  
  GitHub Issue、PR、GitHub Actions、外部 agent から届く作業依頼や通知を置きます。

- `CommandModules/`  
  agent、skill、hook、module registry など、司令塔室の実行モジュールをまとめます。

- `00_Index/`  
  登録したアプリ、資料、module、テンプレートをまとめる全体索引です。

- `1000_OriginalTemplates/`  
  原本テンプレートの目次と参照パスを管理します。

- `BrainAgent/`  
  Brain 全体の整理、索引更新、context block 更新を担当する agent の作業場所です。

- `Reports/`  
  各 agent の作業報告、調査結果、レビュー結果、実行ログの要約を置きます。

- `TechStack/`  
  技術スタック、依存 package、採用技術、連携サービス、学習メモを置きます。

- `Inbox/`  
  まだ分類していない受信物、メモ、資料の一時置き場です。

- `FolderStructure/`  
  `C:\00_master` 全体と主要アプリのフォルダー構成を整理します。

- `Packages/`  
  package 情報、依存関係、導入候補、更新メモを置きます。

## 命名メモ

「技術スタッツ」は統計やメトリクスの意味に近いため、技術構成や package を整理する場所としては「技術スタック」が自然です。
このためフォルダー名は `TechStack` にします。
