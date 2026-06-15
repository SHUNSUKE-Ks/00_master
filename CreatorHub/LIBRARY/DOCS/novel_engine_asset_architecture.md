# NovelEngine と素材Collectionの設計

## 目的

新しい SolidJS 製 NovelEngine は、過去素材と新規発注素材を同じ形式で読み込み、シナリオからすぐ使える状態にします。

旧 `100_gamecollection` は `CreatorGameLab` として再整理し、機能実験場・制作ランチャー・開発再開画面として扱います。本番エンジンには完成した機能だけを移植します。

## 大きな分離

```txt
C:\00_master
├─ CreatorHub\LIBRARY
│  ├─ APP
│  ├─ DATABASE
│  ├─ MATERIALS
│  ├─ INDEX
│  └─ ORDER
│
└─ GAME
   ├─ AdventureEngine
   ├─ BattleEngine
   ├─ CollectionEngine
   └─ _shared
```

## NovelEngine の読み込み方針

NovelEngine は、画像パスを直接持たず、DB上のIDを参照します。

```txt
scenario.scene.backgroundAssetId
  ↓
AssetDB
  ↓
materials/backgrounds/...
```

これにより、素材の差し替え、既存素材の再利用、新規発注素材の追加を同じ流れで扱えます。

## 共通DATABASE

DBはエンジンごとに分けず、`CreatorHub\LIBRARY\DATABASE` にシンプルな共通データとして置きます。

最初に必要なファイルは次の単位です。

- `assets.json`: 画像、音声、UI、スプライトなどの素材本体。
- `characters.json`: キャラクター、表情、立ち絵、ボイスの対応。
- `scenarios.json`: シーン、台詞、選択肢、イベント。
- `collections.json`: 図鑑、解放条件、表示グループ。
- `orders.json`: まだ存在しない素材の発注情報。

`CollectionEngine` はゲーム内の収集・図鑑・解放を担当しますが、DB全体の中心にはしません。中心はあくまで共通 `DATABASE` です。

## 素材の状態

素材には状態を持たせます。

- `existing`: 既存素材。
- `ordered`: 発注済み。
- `needed`: 必要だが未発注。
- `draft`: Codexや画像生成で仮作成。
- `approved`: 本番利用可能。
- `archived`: 今は使わない。

## Codex に任せる範囲

Codex は次を担当できます。

- 画像生成用プロンプトの作成。
- 仮画像の生成。
- 既存素材の分類。
- シナリオで使いやすい素材IDの命名。
- AdventureEngine、BattleEngine、CollectionEngineで共有できるスキーマ案の作成。
- 旧実験機能の移植候補リスト化。

Codex が素材やプロンプトを作った場合も、必ず `assets.json` または `orders.json` に登録する方針にします。

## エンジン間イベント

AdventureEngine は、BattleEngine や CollectionEngine を直接知りすぎないようにします。

例:

```json
{
  "type": "collection.unlock",
  "collectionId": "cg_memory_001",
  "sourceScenarioId": "scenario_intro_001"
}
```

この形式にすると、ノベル中の選択肢から図鑑解放、戦闘開始、報酬付与へつなぎやすくなります。
