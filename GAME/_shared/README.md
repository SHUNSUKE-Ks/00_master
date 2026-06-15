# GAME Shared

`_shared` は、AdventureEngine、BattleEngine、CollectionEngine で共有する型・スキーマ・読み込み規約を置く場所です。

## 置くもの

- engine event schema
- asset reference schema
- scenario schema
- save data schema
- test fixtures
- migration notes

## 方針

各エンジンは、実ファイルパスではなく共通IDを受け取ります。

```txt
assetId -> CreatorHub\LIBRARY\DATABASE -> CreatorHub\LIBRARY\MATERIALS
```

