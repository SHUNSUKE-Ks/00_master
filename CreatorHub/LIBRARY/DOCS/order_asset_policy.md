# 素材発注と再利用の方針

## 素材の入口

素材の入口は2種類に分けます。

### 既存素材の再利用

過去に作った素材を分類して、AssetDBへ登録します。

主な項目:

- assetId
- title
- type
- tags
- sourcePath
- licenseNote
- usageStatus
- compatibleEngines
- promptId

### Order型

まだ存在しない素材は、OrderDBに発注情報として登録します。

主な項目:

- orderId
- title
- targetUse
- assetType
- requiredByEngine
- stylePrompt
- negativePrompt
- references
- acceptance
- status
- outputAssetIds

## Codex の使い方

Codex は発注前に次を作ります。

- 生成用プロンプト。
- 参考素材との差分整理。
- エンジンで必要なサイズ、透過、表情差分、背景差分の条件。
- 受け入れ条件。

素材が完成したら、OrderDB の `outputAssetIds` から AssetDB に接続します。

