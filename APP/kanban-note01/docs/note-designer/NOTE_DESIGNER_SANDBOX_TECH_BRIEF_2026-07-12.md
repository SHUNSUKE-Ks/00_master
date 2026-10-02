# NoteDesigner 事前資料: Sandbox UI Trial

## 目的

既存Noteを壊さず、SolidUI風の見た目とKobalteの操作部品を試し、採用部品だけを将来のNoteへ移植する。

## 隔離

| 項目 | 方針 |
|---|---|
| 入口 | `sandbox.html` の別エントリ |
| 本番App | importしない |
| 本番Store / Firebase | importしない |
| 保存 | `sandbox_note01_` 接頭辞のみ |
| Reset | 既知Seedへ戻す |
| 判別 | 常時 `SANDBOX` 帯 |

## UI分離

```text
SolidJS: 画面State / テストノート本文 / Theme選択
Kobalte: Dialog / Tabs / Focus / Escape
CSS Token: 色 / 面 / 余白 / 角丸 / Theme
SolidUI: レイアウトと部品構成の参照・コピー元
```

## 学習ノート製品ビジョン

```text
Note      : 自分の言葉で書く
WikiLLM   : JsonCardで概念を引く
技術書   : Wikiを土台に、人間が流れで読む
```

画面の核は「読む → 辞書を引く → Noteへ書く」の循環。Sandboxでは、左の3点セット導線、長方形JsonCard、技術書目次だけを先に確認する。

## RawとRelation

- Claude側の `concepts/*.json` と `entities/*.json` は原文のままコピーする。
- Raw JSONへRelationを追記しない。
- UIで使うRelationは `src/sandbox/wiki/relations.ts` に分離する。
- これにより、出典保存と辞書の横断移動を同時に満たす。

## NoteDesignerへの判断材料

- 本番へ移植する候補: Header、Sidebar、Tabs、Dialog、Card、Editor Surface。
- 移植しない候補: Sandbox帯、Seed Reset、テスト用Future Clip表示。
- 画面の見た目はTokenで替え、機能部品はKobalteに寄せる。
- 既存Noteのデータ構造や決済経路は、Sandbox評価中に変更しない。

## 次の確認順

1. Midnight / Paperテーマで文字量と入力面を比較する。
2. Android幅でTabs、Dialog、Resetの押しやすさを確認する。
3. 本番へ移す部品を1つだけ選ぶ。
4. NoteDesignerは選定理由、Token、部品境界を記録する。
