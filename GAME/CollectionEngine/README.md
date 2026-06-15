# CollectionEngine

CollectionEngine は、ゲーム内の収集・図鑑・解放条件・閲覧状態を扱うゲームエンジンです。

## CreatorHub 側との違い

- `CreatorHub\LIBRARY\APP\AssetCollectionApp`: 素材を管理する制作ツール。
- `CreatorHub\LIBRARY\DATABASE`: 素材、キャラクター、シナリオ、発注のDB。
- `GAME\CollectionEngine`: ゲーム内で収集物として見せる・解放する・記録するエンジン。

## 初期方針

素材そのものを直接管理せず、`assetId`、`collectionId`、`unlockConditionId` を参照します。

