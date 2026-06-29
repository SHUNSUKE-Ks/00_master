# APP04 Pinterest風 Galleryビュー 要件定義・画面レイアウト

作成日: 2026-06-28

## 目的

既存のInstagram風Galleryを残したまま、新しくPinterest風のGalleryビューを追加する。

このビューは、ノベルゲーム制作・キャラクター資料・UI資料・背景資料などを素早く眺め、探し、ノートや制作画面へ再利用するための画像管理画面とする。

うまく機能した場合は、ゲーム内の素材選択ウィンドウ、キャラクター資料ウィンドウ、装備/アイテム図鑑、開発用アセットブラウザにも流用する。

## 参照した画面

- PC版Pinterest風スクリーンショット
- iPad版Pinterest風スクリーンショット
- `C:\00_master\InBox\ピンタレスアプリ作成レイアウト.txt`

## 基本方針

- 既存のInstagram風 `grid` 表示は削除しない。
- 新しい表示モードとして `pinterest` または `masonry` を追加する。
- 画像は複製せず、同じ画像データを参照する。
- Board、Collection、Pinは新規に作成する。
- 以前の上部カテゴリ候補はタグとしては一度リセットする。
- `Title DB` はScenario用なので触らない。
- NOTE側にある `DB02 Tag DB` 相当を、別名の共通 `Asset Tag DB` へ昇格させる。
- TagDBはNote / Gallery / Game / Scenarioなどで表示対象を切り替えられるようにする。
- Firebaseは既存ノートアプリと同じプロジェクトを使い、画像用コレクションを分ける。
- 最初はローカルサンプルデータでUIを固め、後からFirebaseへ接続する。

## CreateGameLab / novelEngine 相談メモ

参照した既存方針:

- `CreatorGameLab` は、画面テンプレートとデータソースを分離する。
- novelEngineは、画像パスを直接持たず、AssetDB上のIDを参照する。
- 共通DATABASEには `assets.json` / `characters.json` / `scenarios.json` / `collections.json` / `orders.json` がある想定。
- novelEngineタグ辞書には `bg_` / `char_` / `face_` / `cg_` / `bgm_` / `se_` / `fx_` / `ui_` などの接頭辞がある。

結論:

- `Title DB` はScenario構造のために残す。
- 画像アセット用タグは `Asset Tag DB` として別に作る。
- GalleryのPinterest風/Instagram風表示は、Titleプルダウン側に「表示モード」として色付きアイコン付きで並べる。
- Asset Tag DBは、novelEngineの接頭辞と親和性を持たせる。
- CreateGameLabに流す場合も、UIを触らずJSONデータソースとして渡せる形にする。

## 用語定義

| 名称 | 意味 |
| --- | --- |
| Pin | 1枚の画像または素材参照。画像本体ではなく、表示・分類・再利用の単位。 |
| Board | 大きな分類。例: スケッチ、キャラクターデザイン、背景、UI、音符アート。 |
| Collection | Boardより柔らかい横断分類。例: 主人公案、和風衣装、黒ファッション、魔女資料。 |
| Tag | 検索・類似表示用の小さな属性。ノベルゲーム画像アセットに特化して再設計する。 |
| Masonry | Pinterest風のレンガ状レイアウト。画像の高さ差を活かして詰める表示。 |

## リセット対象の旧タグ

以下はPinterest画面上部のカテゴリ案として一度出したものだが、共通TagDBにはそのまま入れない。

```txt
すべて
effect
スケッチ
マンガ背景
ゲームui
音符アート
操作パネル
2dSprite
キャラクターデザイン
マンガ
ItemBox
バナー
和洋折衷
黒ファッション
魔女イラスト
素材ファイル
スチームパンク
```

理由:

- これは「画面上部の表示カテゴリ」と「検索タグ」が混ざっている。
- ノベルゲーム制作では、画像の内容・用途・表現・制作工程を分けた方が後で探しやすい。
- 使わないタグを整理対象にするには、TagDB側で表示対象を制御できる必要がある。

今後は、Board / Collection / Tagを分離する。

| 種別 | 例 | 用途 |
| --- | --- | --- |
| Board | キャラクター資料、背景資料、UI資料、エフェクト、アイテム | 大きな棚 |
| Collection | 和風ヒロイン案、黒衣装、魔女候補、戦闘ポーズ | 制作中のまとめ |
| Tag | female, samurai, monochrome, kimono, sword, bust-up | 類似検索・絞り込み |

## 機能要件

### APP04-REQ-01 表示モード追加

Galleryに以下の表示モードを持たせる。

- `grid`: 既存のInstagram風グリッド
- `list`: 既存のリスト
- `pinterest`: 新規Pinterest風Masonry

Titleプルダウンにも、わかりやすい色付きアイコン付きでGallery表示モードを入れる。

```txt
Note_Story Menu
  IN  InBox
  DS  Scenario Board
  SN  シナリオノート
  ST  Study
  DB  DB

Gallery View
  🟣  Gallery
  🟪  Instagram Grid
  🔴  Pinterest Masonry
  🟦  Asset Tag DB
```

注意:

- `Title DB` はScenario用なので、この変更では触らない。
- `Asset Tag DB` はタグ管理用の別DBとして置く。
- プルダウン上では「現在どのビューにいるか」が色とチェックで分かるようにする。
- 既存ヘッダーには、よく使うものを2つだけ並べる。
- 候補は `Gallery` と `Asset Tag DB`、またはユーザーが選んだお気に入り2件。

ヘッダーの固定ショートカット案:

```txt
[Note_Story ▼]  [🟣 Gallery]  [🟦 Asset Tag DB]      Search / JSON / MD / Settings
```

お気に入り化する場合:

```txt
favoriteViews: ['gallery-pinterest', 'asset-tag-db']
```

初期値は `Gallery` と `Asset Tag DB` を推奨する。

### APP04-REQ-02 Masonryレイアウト

画像の縦横比をできるだけ維持して、Pinterest風に詰めて表示する。

- PC: 5〜7列
- iPad横: 4列前後
- iPad縦: 3列前後
- スマホ: 2列
- 画像間隔は狭め
- カード角丸は控えめから中程度
- 黒背景モードと白背景モードの両方に対応できる設計にする

### APP04-REQ-03 iPad向け触り心地

iPadでは指操作を優先する。

- タップ: 詳細/ライトボックスを開く
- 長押し: タグ編集またはクイック操作
- 横スクロール: Board/Tagカテゴリ移動
- 下部フローティングナビ: ホーム、検索、プロフィール/設定
- 右上: 追加、メニュー
- カードの三点メニューは指で押しやすいサイズにする

### APP04-REQ-04 検索・絞り込み

検索対象は以下。

- 日本語ラベル
- ファイル名
- タグ
- Board名
- Collection名
- プロンプト
- 参照元URL
- 説明文

### APP04-REQ-05 Board / Collection

上部に横スクロール可能なBoardタブを置く。

初期Board候補:

- すべて
- Character
- Background
- UI
- Effect
- Item
- Sprite
- MangaRef
- PromptRef
- Other

CollectionはPin詳細またはサイドパネルで管理する。

### APP04-REQ-06 ドラッグ＆ドロップ再利用

Pinをノート、シナリオ、ゲーム制作画面へドラッグして貼れる入口を作る。

初期実装では、ドラッグ時に以下の情報を渡す。

- 画像URLまたはローカル参照
- `pinId`
- 日本語ラベル
- タグ
- プロンプト
- 参照元URL

### APP04-REQ-07 類似画像

機械学習検索は初期スコープ外。

代替として、タグ一致・Board一致・Collection一致で「近い画像」を表示する。

類似画像表示は、参考画像のように「選択中Pinの右側または下側」にMasonryで出す。

- 選択中Pin: 左側または上部に大きく表示
- 1階層目情報: 必要最小限だけ表示
- 類似Pin: 右側または下部に流し込み表示
- 2階層目情報: 詳細パネル、折りたたみ、またはメタ情報タブで表示

### APP04-REQ-08 共通TagDB

NOTE側の `DB02 Tag DB` 相当を、共通 `Asset Tag DB` として使う。

現在のコードでは `Nutrient` / `nutrients` という旧名が残っているため、段階的に `AssetTag` / `tags` へ移行する。

TagDBにはマルチセレクト項目を追加し、どのアプリで表示するかを選べるようにする。

```txt
visibleIn:
  - note
  - gallery
  - game
  - scenario
  - hidden
```

運用:

- Galleryで使うタグは `gallery` をONにする。
- Noteで使うタグは `note` をONにする。
- 使わないタグは全アプリから外すか、`hidden` にする。
- `hidden` のタグは削除候補または整理対象として扱う。

TagDBはTitleDBとは別物にする。TitleDBはScenario用、Asset Tag DBは画像・音声・UI・演出素材用。

### APP04-REQ-08B Asset Tag DB カラム再設計

Tag用DBが画面上で見つかりにくいため、これを機にカラムを作り直す。

最小カラム:

| カラム | 型 | 用途 |
| --- | --- | --- |
| tagId | text | `tag_char_heroine` などの安定ID |
| labelJa | text | 日本語表示名 |
| labelEn | text | 英語/slug候補 |
| prefix | select | novelEngine接頭辞。`bg_`, `char_`, `face_`, `cg_`, `fx_`, `ui_` など |
| kind | select | subject / style / use / mood / composition / color / production / source |
| visibleIn | multi-select | note / gallery / game / scenario / hidden |
| assetType | multi-select | image / audio / ui / sprite / scenario / collection |
| engineUse | multi-select | AdventureEngine / BattleEngine / CollectionEngine / CreatorGameLab |
| status | select | active / draft / review / deprecated / hidden |
| aliases | text[] | 同義語 |
| parentTagId | relation | 階層タグ |
| description | text | 説明 |
| memo | text | 作業メモ |
| updatedAt | datetime | 更新日 |

拡張カラム:

| カラム | 型 | 用途 |
| --- | --- | --- |
| promptHint | text | 画像生成や検索時に使う補助語 |
| negativeHint | text | 避けたい要素 |
| sortOrder | number | 表示順 |
| color | text | UI上の色 |
| icon | text | UI上のアイコン |
| relatedTagIds | relation[] | 関連タグ |
| exampleAssetIds | relation[] | 代表画像 |

UI上の表示:

- 一覧では `labelJa`, `prefix`, `kind`, `visibleIn`, `status` を優先表示する。
- 詳細では `promptHint`, `aliases`, `relatedTagIds`, `exampleAssetIds` を表示する。
- `visibleIn` に `gallery` が入っているタグだけGalleryのフィルターに出す。
- `hidden` のタグは通常画面に出さず、整理ビューで確認する。

### APP04-REQ-09 GalleryViewで見せる情報階層

Pinterest風GalleryViewでは画像が主役なので、情報を出しすぎない。

1階層目、つまり一覧で目に触れる情報:

- 画像URLまたはローカル参照
- `pinId`
- 日本語ラベル
- タグの一部

ただし `pinId` は内部的に保持し、一覧には基本表示しない。

2階層目、たまに見る情報:

- プロンプト
- 参照元URL
- ファイル名
- 解像度
- 作成日/更新日
- 使用回数
- 所属Board
- 所属Collection

2階層目は、詳細パネル・メタ情報タブ・折りたたみ領域で表示する。

## 非機能要件

### Tailwind方針

- Tailwind CSSを中心に画面を作る。
- 余白、角丸、影、背景色、アニメーションを統一する。
- `transition`, `duration`, `ease-out`, `active:scale-*` を使い、触った時の反応を滑らかにする。
- iPadでは小さすぎるボタンを避ける。
- 画像閲覧が主役なので、UI装飾は控えめにする。

### 推奨トークン

```txt
背景:
  light: bg-gray-50 / bg-white
  dark : bg-black / bg-neutral-950

カード:
  rounded-[18px] または rounded-2xl
  overflow-hidden
  bg-white dark:bg-neutral-900

余白:
  page: p-3 md:p-4
  gap : gap-2 md:gap-3

操作:
  transition-all duration-200 ease-out
  active:scale-[0.97]
  hover:brightness-95

下部ナビ:
  fixed bottom-4 left-1/2 -translate-x-1/2
  rounded-3xl bg-neutral-900/90 backdrop-blur
```

## 画面レイアウト: iPad横

Pinterest iPad版に近い、黒背景・上部カテゴリ・Masonry中心の構成。

```txt
┌──────────────────────────────────────────────────────────────────────────────┐
│ Status / App Header                                                   + ・・・ │
│ PinterestGallery / Search / Add / User                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ すべて  effect  スケッチ  マンガ背景  ゲームui  音符アート  2dSprite ...       │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │              │ │              │ │              │ │              │          │
│ │   Pin Card   │ │ Tall Pin     │ │ Wide Pin     │ │ Character    │          │
│ │              │ │              │ │              │ │ Sheet        │          │
│ └──────────────┘ │              │ └──────────────┘ │              │          │
│ title       ・・・└──────────────┘ title       ・・・│              │          │
│ ┌──────────────┐ title       ・・・┌──────────────┐ └──────────────┘          │
│ │              │                  │              │ title       ・・・         │
│ │ Sketch Pin   │ ┌──────────────┐ │ Dress Pin    │                            │
│ │              │ │ Sprite Sheet │ │              │                            │
│ └──────────────┘ │              │ │              │                            │
│ title       ・・・└──────────────┘ └──────────────┘                            │
│                                                                              │
│                         ┌────────┐ ┌────────┐ ┌────────┐                     │
│                         │ Home   │ │ Search │ │ User   │                     │
│                         └────────┘ └────────┘ └────────┘                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 画面レイアウト: Pin選択後 / 類似画像表示

参考画像に近い、選択中のPinと類似Pinを同時に見る画面。

```txt
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header / Search / Add / Menu                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────┐ ┌─────────────────────────────────────────┐ │
│ │                              │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐     │ │
│ │                              │ │ │ Similar │ │ Similar │ │ Similar │     │ │
│ │        Selected Pin          │ │ │ Pin     │ │ Pin     │ │ Pin     │     │ │
│ │                              │ │ └─────────┘ └─────────┘ └─────────┘     │ │
│ │                              │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐     │ │
│ └──────────────────────────────┘ │ │ Similar │ │ Similar │ │ Similar │     │ │
│ 日本語ラベル                     │ │ Pin     │ │ Pin     │ │ Pin     │     │ │
│ #tag #tag #tag                   │ │ └─────────┘ └─────────┘ └─────────┘     │ │
│ [詳細] [ノートへ使う] [保存]      │ └─────────────────────────────────────────┘ │
│                                                                              │
│ 2階層目: prompt / sourceUrl / filename / size は詳細内に折りたたむ             │
└──────────────────────────────────────────────────────────────────────────────┘
```

類似Pinの取得ルール:

1. 同じ `tagIds` が多い順
2. 同じ `boardId`
3. 同じ `collectionIds`
4. `style` / `subject` / `use` の一致を少し重くする
5. 表示済み・削除済みを除外する

## 画面レイアウト: iPad縦

縦向きではカテゴリを1行スクロールにし、Masonryは3列を基本にする。

```txt
┌──────────────────────────────────────┐
│ Header                         + ・・・│
├──────────────────────────────────────┤
│ すべて  effect  スケッチ  ゲームui ... │
├──────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Pin      │ │ Tall     │ │ Pin      │ │
│ │          │ │ Pin      │ │          │ │
│ └──────────┘ │          │ └──────────┘ │
│ title   ・・・└──────────┘ title   ・・・│
│ ┌──────────┐ title   ・・・┌──────────┐ │
│ │ Wide     │ ┌──────────┐ │ Character│ │
│ │ Pin      │ │ Sketch   │ │ Sheet    │ │
│ └──────────┘ └──────────┘ │          │ │
│ title   ・・・title   ・・・└──────────┘ │
│                         title   ・・・ │
│        ┌──────┐ ┌──────┐ ┌──────┐     │
│        │Home  │ │Search│ │User  │     │
│        └──────┘ └──────┘ └──────┘     │
└──────────────────────────────────────┘
```

## 画面レイアウト: PC

PCでは既存の左サイドバーを残す案と、Pinterest寄せでサイドバーを畳む案の2案を持つ。

### 案A: 既存Gallery構造を活かす

```txt
┌──────────────┬───────────────────────────────────────────────────────────────┐
│ Sidebar      │ Header / Search / View Toggle / Add                           │
│              ├───────────────────────────────────────────────────────────────┤
│ Board        │ Board Tabs                                                     │
│ Collection   ├───────────────────────────────────────────────────────────────┤
│ Tags         │ Masonry Pins                                                   │
│ Sort         │                                                               │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

### 案B: Pinterest寄せ

```txt
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header / Search / Add / User                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ Board Tabs                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Masonry Pins                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

初期実装は案Aを推奨する。既存のフィルターやタグ管理を活かせるため。

## コンポーネント案

```txt
src/pages/gallery/
  GalleryPinterestGrid.tsx
  GalleryPinterestCard.tsx
  GalleryBoardTabs.tsx
  GalleryCollectionPanel.tsx
  GalleryPinMenu.tsx
  GalleryBottomNav.tsx
```

既存:

```txt
GalleryGrid.tsx
GalleryCard.tsx
GalleryHeader.tsx
GallerySidebar.tsx
GalleryLightbox.tsx
GalleryTagSheet.tsx
```

既存コンポーネントは壊さず、新規ビューだけ追加する。

## データモデル案

```ts
export type GalleryView = 'grid' | 'list' | 'pinterest'

export type TagUsageTarget = 'note' | 'gallery' | 'game' | 'scenario' | 'hidden'

export type NovelEngineTagPrefix =
  | 'bg_'
  | 'char_'
  | 'face_'
  | 'cg_'
  | 'bgm_'
  | 'se_'
  | 'fx_'
  | 'ui_'
  | 'cam_'
  | 'ev_'
  | 'flag_'
  | 'req_'
  | 'memo_'
  | 'fn_'

export type AssetDbType = 'image' | 'audio' | 'ui' | 'sprite' | 'scenario' | 'collection'

export type EngineUse = 'AdventureEngine' | 'BattleEngine' | 'CollectionEngine' | 'CreatorGameLab'

export type TagStatus = 'active' | 'draft' | 'review' | 'deprecated' | 'hidden'

export type AssetTagKind =
  | 'subject'
  | 'style'
  | 'use'
  | 'mood'
  | 'composition'
  | 'color'
  | 'production'
  | 'source'

export type AssetTag = {
  id: string
  labelJa: string
  labelEn?: string
  slug: string
  prefix?: NovelEngineTagPrefix
  kind: AssetTagKind
  visibleIn: TagUsageTarget[]
  assetType: AssetDbType[]
  engineUse: EngineUse[]
  status: TagStatus
  aliases?: string[]
  parentId?: string
  relatedTagIds?: string[]
  exampleAssetIds?: string[]
  promptHint?: string
  negativeHint?: string
  color?: string
  icon?: string
  sortOrder?: number
  description?: string
  memo?: string
  createdAt: Date
  updatedAt: Date
}

export type GalleryBoard = {
  id: string
  label: string
  slug: string
  color?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export type GalleryCollection = {
  id: string
  boardId?: string
  label: string
  description?: string
  pinIds: string[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export type GalleryItem = {
  id: string
  filename: string
  label: string
  japaneseLabel?: string
  description?: string
  tagIds: string[]
  tags?: string[] // migration用。最終的には tagIds を正とする。
  boardId?: string
  collectionIds?: string[]
  category: GalleryCategory
  mimeType: string
  fileSize?: number
  width?: number
  height?: number
  url?: string
  dataUrl?: string
  prompt?: string
  sourceUrl?: string
  usageCount?: number
  originType?: 'upload' | 'firebase' | 'external' | 'generated'
  isFavorite: boolean
  isDeleted?: boolean
  createdAt: Date
  updatedAt: Date
}
```

## ノベルゲーム画像アセット向けTagDB初期分類

新TagDBは、単なる日本語カテゴリではなく「探し方」に合わせて分類する。

| kind | 目的 | 例 |
| --- | --- | --- |
| subject | 何が写っているか | character, girl, boy, sword, castle, room |
| style | 絵柄・表現 | anime, manga, sketch, pixel-art, watercolor, monochrome |
| use | ゲーム内用途 | standing, face-icon, background, cg, ui-panel, item-icon |
| mood | 雰囲気 | dark, cute, lonely, heroic, mysterious |
| composition | 構図 | bust-up, full-body, close-up, side-view, top-down |
| color | 色・配色 | black, white, blue, gold, pastel, high-contrast |
| production | 制作工程 | draft, reference, final, generated, retouch-needed |
| source | 入手元・性質 | upload, pinterest-ref, ai-generated, own-asset |

初期タグ例:

```txt
character
background
ui-panel
item-icon
effect
sprite
standing
face-icon
full-body
bust-up
close-up
sketch
monochrome
manga
anime
pixel-art
fantasy
modern
japanese
western
steampunk
witch
samurai
kimono
sword
black-fashion
generated
reference
retouch-needed
```

この初期タグは `visibleIn: ['gallery']` を基本にする。Noteにも必要なタグだけ `note` を追加する。

## Firebaseコレクション案

```txt
galleryItems
galleryBoards
galleryCollections
tags
galleryUsageLogs
```

Storage:

```txt
gallery/images/{itemId}/original
gallery/images/{itemId}/thumbnail
```

## Tailwindレイアウト例

MasonryはCSS columns方式から始めると軽く実装できる。

```tsx
<div class="columns-2 md:columns-3 xl:columns-5 2xl:columns-6 gap-3 p-3">
  <article class="mb-3 break-inside-avoid rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 transition-all duration-200 ease-out active:scale-[0.98]">
    <img class="w-full h-auto object-cover" />
    <div class="px-2.5 py-2">
      <div class="flex items-start justify-between gap-2">
        <p class="text-sm font-semibold line-clamp-2">title</p>
        <button class="size-8 rounded-full">...</button>
      </div>
    </div>
  </article>
</div>
```

より精密な並びが必要になったら、仮想スクロールまたはMasonryライブラリ導入を検討する。

## ゲームUIへの再利用メモ

このAPP04ビューは、以下へ流用できる。

- キャラクター資料選択ウィンドウ
- 背景資料ブラウザ
- アイテム図鑑
- 装備選択画面
- スキル/カード一覧
- 開発用アセットピッカー
- ノベルゲームの立ち絵・表情差分選択

再利用時は、Gallery固有名を避けて以下の名前で抽象化する。

```txt
AssetMasonryView
AssetCard
AssetBoardTabs
AssetCollectionPanel
AssetQuickMenu
AssetBottomNav
```

## 実装順

1. `GalleryView` に `pinterest` を追加する。
2. `GalleryHeader` にPinterest表示ボタンを追加する。
3. `GalleryPinterestGrid.tsx` を追加する。
4. `GalleryPinterestCard.tsx` を追加する。
5. `GalleryGrid.tsx` から `pinterest` の時だけ新規Gridを表示する。
6. Boardタブの仮データを追加する。
7. iPad横・iPad縦・PCで表示確認する。
8. 操作感を調整する。
9. Firebase用データモデルに寄せる。

## スカフォールド実装メモ

2026-06-28時点で、見た目確認用のスカフォールドを追加した。

対象:

- HeaderのTitleプルダウンに `Instagram Grid` / `Pinterest Masonry` / `Asset Tag DB` を追加
- Headerによく使う入口として `Gallery` と `Asset Tags` を配置
- Gallery内の表示切替に `P` ボタンを追加
- `GalleryView = 'grid' | 'list' | 'pinterest'` に拡張
- `GalleryPinterestGrid.tsx` を追加
- 実データがない場合もPinterest風Masonryの見た目を確認できる仮Pinを表示
- Pinterest表示時は左GallerySidebarを畳み、画像面を広く使う
- `ノートへ使う` は一覧常時表示ではなく、ホバー/フォーカス時の軽い `Note` アクションへ変更
- `Asset Tag DB` はTitle DB / Character DBを触らず、現段階では入口ログのみ。専用ページは次Phaseで追加する
- 新規機能の接続箇所は `[APP04-...]` 接頭詞の `console.log` でログを出すだけにする

この段階では、保存・タグ更新・Firebase接続・AssetTag永続化は実装しない。

手動確認コマンド:

```powershell
cd C:\00_master\APP\Note
npm run dev -- --host 127.0.0.1 --port 5174
```

## 初期DONE条件

- 既存Instagram風Galleryがそのまま使える。
- 新しいPinterest風ビューへ切り替えられる。
- iPad横で4列前後のMasonry表示になる。
- iPad縦で3列前後のMasonry表示になる。
- カードのタップ、長押し、三点メニューが破綻しない。
- Boardタブが横スクロールで使える。
- Tailwind中心でスタイルが管理されている。
- ゲームUIへ流用できるコンポーネント境界が見える。
