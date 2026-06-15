# AdventureEngine

AdventureEngine は、ノベルゲーム、会話、探索、分岐、フラグ管理を扱うゲームエンジンです。

## 初期移植候補

```txt
C:\Users\enjoy\InBox2026\InBox0601\06_AppList\solidjs-novel-engine-01-short-schema
```

このプロジェクトは、`ShortNovelEngine` として移植する候補です。

## 目標

- `CreatorHub\LIBRARY\DATABASE` の素材・キャラクター・背景・シナリオDBを読める。
- `CreatorHub\LIBRARY\MATERIALS` の実ファイル素材を参照できる。
- 画像・音声・背景・立ち絵・UI素材を、シナリオからID指定で呼び出せる。
- BattleEngine と CollectionEngine に渡すイベントを、共通スキーマで出せる。

## 移植前の禁止事項

- 旧 `100_gamecollection` の実験機能を一括移植しない。
- 用途が不明なComponentを本番に入れない。
- 素材パスをコンポーネント内に直書きしない。
- 実験用DBと本番用DBを混ぜない。

