# GAME

`C:\00_master\GAME` は、CreatorHub が管理する素材・DB・発注情報を読み込み、実際のゲーム体験として動かすエンジン群の置き場です。

## 基本方針

- `CreatorHub\LIBRARY` は素材・DB・索引・発注・管理アプリの場所。
- `GAME` はゲームロジックと実行エンジンの場所。
- 実験中の機能は `C:\202604_claude_workspace\100_gamecollection` で隔離し、完成後にこの配下へ移植する。
- 移植するときは、必ず `CreatorHub\LIBRARY\INDEX` の目次と、対象エンジンの README を更新する。

## エンジン構成

```txt
C:\00_master\GAME
├─ AdventureEngine
├─ BattleEngine
├─ CollectionEngine
└─ _shared
```

### AdventureEngine

ノベル、会話、探索、分岐、フラグ、シナリオ再生を担当します。

最初の中核は、既存の `solidjs-novel-engine-01-short-schema` を移植した `ShortNovelEngine` とします。

### BattleEngine

戦闘、ステータス、スキル、敵、報酬、バランス検証を担当します。

### CollectionEngine

ゲーム内の図鑑、収集、解放条件、所持状態、閲覧状態を担当します。

素材管理アプリそのものは `CreatorHub\LIBRARY\APP` に置きます。`CollectionEngine` は、ゲーム中にそれをどう見せるか・どう解放するかを扱います。

### _shared

3つのエンジンで共有する型、スキーマ、読み込み規約、テスト用fixtureを置きます。

