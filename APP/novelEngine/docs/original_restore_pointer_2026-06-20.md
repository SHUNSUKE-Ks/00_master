# novelEngine 原本復帰ポインター

meta:
  date: 2026-06-20
  owner: codex
  status: active
  purpose: novelEngineの原本を別コピーせず、バージョン管理と記録から戻れるようにする

## 方針

`C:\00_master\APP\novelEngine` の原本コピーは作らない。

戻れる状態を、Gitの履歴とこのテキスト記録で管理する。

## 対象

```txt
C:\00_master\APP\novelEngine
```

## 現在の原本由来

```txt
C:\Users\enjoy\InBox2026\InBox0601\06_AppList\solidjs-novel-engine-01-short-schema
```

詳細:

```txt
C:\00_master\APP\novelEngine\ORIGIN.md
```

## 2026-06-20時点の既知変更

Smoke Test用に以下を追加済み。

```txt
C:\00_master\APP\novelEngine\package.json
C:\00_master\APP\novelEngine\scripts\smoke-assets.mjs
```

目的:

- scenario JSON確認
- schema確認
- Character / 背景 / BGMの実ファイル確認
- SEが未設定であることを警告として表示

## 復帰するときに見る場所

1. `C:\00_master\APP\novelEngine\ORIGIN.md`
2. `C:\00_master\APP\novelEngine\docs\novel_engine_restore_note_2026-06-19.md`
3. `C:\00_master\APP\novelEngine\docs\original_restore_pointer_2026-06-20.md`
4. Git履歴

## 注意

- Note系アプリは触らない。
- novelEngineはDevLayer実験の対象だが、原本を壊す変更は避ける。
- 大きく変更する場合は、先にReportとTaskTicketを残す。

