# Note 原本テンプレート

## 現在の位置づけ

この `C:\00_master\APP\Note` は、汎用ノートアプリの原本テンプレートです。

移植直後のスナップショットは、`C:\00_master` の Git commit `3e95829` に残っています。

## 役割

このフォルダーは、今後の派生ノートアプリを作るためのベースとして扱います。
司令塔室専用の改造は、このフォルダーではなく派生アプリ側で行います。

## 派生アプリ

```text
C:\00_master\APP\kanban-note01
```

`kanban-note01` は、`kanban_June` と `Brain` に連動するこのプロジェクト専用ノートです。

## 住み分け

```text
APP\Note
= 汎用 Note 原本テンプレート
= 直接の大改造は避ける

APP\kanban-note01
= カンバン特化ノート
= Brain / kanban_June / agent context と連動する
```

