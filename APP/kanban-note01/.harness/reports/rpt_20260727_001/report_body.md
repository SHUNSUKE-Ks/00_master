# 8月開発環境向け Kanban / Note移行候補目録

## 提出内容

Note、Kanban、HarnessBoardについて、現行のソース、実行設定、Firebase/PWA/Tauri設定、仕様資料、Report契約を移行候補として整理した。

## 方針

- 元データは移動・削除・改名しない。
- 現行稼働中のアプリは、8月環境へまずCopyする。
- 再生成可能な依存物・ビルド出力はExcludeする。
- Secretは提出目録には示すが、コピー対象に含めない。

## 人間判断待ち

1. KanbanとHarnessBoardのReport正本をどう分担するか。
2. Firebaseプロジェクトを維持・統合・再作成のどれにするか。
3. Note SandboxとStudy資料の8月環境での位置づけ。
4. Secretの安全な移管方法。

## 検証

提出先READMEを確認し、提出目録の保存後に主要候補IDとファイル存在を確認した。
