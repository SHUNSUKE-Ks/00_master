# Note アプリの原本と改造方針

## 現在の位置づけ

この `C:\00_master\APP\Note` は、`note00-gallerynotedb_vol1.1` を移植したものです。

移植直後のスナップショットは、`C:\00_master` の Git commit `3e95829` に残っています。

## 今後の扱い

このフォルダーは、今後 `kanban_June` と `Brain` に連動するカンバン特化ノートとして改造します。

つまり、このフォルダーは「原本そのもの」ではなく、司令塔室専用に育てる作業版です。

## 原本 Note の扱い

汎用の原本 Note が必要になった場合は、Git clone で別フォルダーに起こし、新しい名前を付けて管理します。

例:

```text
C:\00_master\APP\NoteOriginal
C:\00_master\APP\GalleryNoteBase
C:\00_master\APP\NoteGeneral
```

## 住み分け

```text
APP\Note
= カンバン特化ノート
= Brain / kanban_June / agent context と連動する

別名で clone した Note
= 汎用ノート原本
= 雑多なノートアプリとして保持する
```

