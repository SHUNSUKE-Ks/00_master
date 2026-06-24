# TitleGameStudio 命名・接頭詞・Versionルール

meta:
  date: 2026-06-22
  agent: codex
  topic: TitleGameStudio naming / prefix / version rules
  status: draft
  target: CreatorGameLab / TitleGameStudio package

## 目的

他のプロジェクト立ち上げ時にも迷わないように、TitleGameStudio packageの資料名、接頭詞、version、latest判定を固定する。

## 基本方針

- 人間が開く入口は短く固定名にする。
- AIが追跡する資料は接頭詞とversionを持つ。
- latestはファイル名だけでなく、package manifestの `currentVersion` で判定する。
- 履歴を残す資料は `YYYY-MM-DD` または `v0_1` を付ける。
- Studioごとの差し替えは、同じ命名規則でpackageを増やす。

## 推奨接頭詞

ファイル名の先頭に2〜4文字の接頭詞を置く。
人間がフォルダーを見た瞬間に資料種別を判断できるようにする。

日本語表示用の短い接頭詞を優先し、必要に応じて英語の補助接頭詞を使う。

| 接頭詞 | 英語補助 | 用途 | 例 |
|---|---|---|
| `本体` | `TGS` | TitleGameStudio本体 | `本体_2D_SRPGStudio_index.html` |
| `仕様` | `SPEC` | 仕様書 | `仕様_title-game-studio-package_v0_1.md` |
| `報告` | `REPORT` | Kanbanや作業報告 | `報告_title-game-studio-package-todo_2026-06-22.md` |
| `包体` | `PKG` | package manifest / package仕様 | `包体_title-game-studio.package.json` |
| `Slot` | `SLOT` | slot JSON | `Slot_screen-layout.slot.json` |
| `型定` | `SCHEMA` | schema JSON | `型定_screen-layout.slot.schema.json` |
| `工程` | `TODO` | Studioを作るTODO | `工程_studio-build.html` |
| `納品` | `DELIV` | Engineへ渡すRuntime納品 | `納品_runtime-json.html` |
| `注文` | `ORDER` | Engine注文書 | `注文_engine-order.slot.json` |
| `修正` | `FIX` | 修正依頼ログ | `修正_fix-log.slot.json` |
| `素材` | `ASSET` | 画像・音・UI素材一覧 | `素材_asset-manifest.slot.json` |
| `画面` | `SCREEN` | screen layout / screen state | `画面_screen-layout.slot.json` |
| `接続` | `BIND` | Engine binding | `接続_engine-binding.slot.json` |
| `保存` | `SAVE` | Save / Load / resume | `保存_save-slots.slot.json` |

## 接頭詞運用

### 表示名と実ファイル名

人間向け資料では、頭に2〜4文字の接頭詞を入れる。

```txt
仕様_TITLE_GAME_STUDIO_PACKAGE_SPEC_2026-06-22.md
報告_title_game_studio_package_todo_report_2026-06-22.md
工程_todo.html
納品_runtime-json-todo.html
```

ただし、既に参照されているファイルはリンク切れを避けるため、すぐには改名しない。
新規作成分から接頭詞を付ける。

### 固定入口ファイルの扱い

`index.html` など、ブラウザやツールが期待しやすい固定名は残す。
必要なら横に接頭詞付きの説明資料を置く。

```txt
index.html
工程_todo.html
納品_runtime-json-todo.html
```

初期段階では、既存の `todo.html` / `runtime-json-todo.html` は残し、正式化時に接頭詞付きへ移行する。

## ファイル命名

### HTML入口

人間が直接開くHTMLは短い固定名にする。

```txt
index.html
todo.html
runtime-json-todo.html
```

意味:

- `index.html`: Studio本体
- `todo.html`: Studioを作る工程TODO
- `runtime-json-todo.html`: 完成済みEngineへ渡すJSON納品TODO

### JSON / Schema

slotとschemaは種類がわかる固定名にする。

```txt
package/title-game-studio.package.json
package/slots/screen-layout.slot.json
package/slots/asset-manifest.slot.json
package/schemas/screen-layout.slot.schema.json
```

### Markdown資料

MarkdownはAI検索しやすいように、内容名 + 日付を付ける。

```txt
TITLE_GAME_STUDIO_PACKAGE_SPEC_2026-06-22.md
TITLE_GAME_STUDIO_NAMING_VERSION_RULES_2026-06-22.md
```

## Versionルール

### schemaVersion

schemaVersionは破壊的変更の判断に使う。

```json
"schemaVersion": "creator-game-lab.title-game-studio-package.v0.1"
```

形式:

```txt
creator-game-lab.<domain>.<kind>.v<major>.<minor>
```

例:

- `creator-game-lab.title-game-studio-package.v0.1`
- `creator-game-lab.screen-layout-slot.v0.1`
- `creator-game-lab.runtime-manifest-slot.v0.1`

### packageVersion

packageVersionはStudio package全体の版を表す。

```json
"packageVersion": "0.1.0"
```

更新基準:

- patch: 文言、表示、軽微なslot追加
- minor: slot追加、schema追加、Engine連携範囲追加
- major: slot構造やEngine受け渡し方式の破壊的変更

## latest判定

最新は次の順で見る。

1. `package/title-game-studio.package.json`
2. `packageVersion`
3. `updatedAt`
4. `status`
5. registry側の `packageManifestPath`

ファイル名に `latest` は付けない。
代わりにmanifestを真実源にする。

## package manifestに追加する推奨フィールド

```json
{
  "packageVersion": "0.1.0",
  "latest": true,
  "versionLabel": "v0.1 draft",
  "updatedAt": "2026-06-22T00:00:00+09:00",
  "changeLog": [
    {
      "version": "0.1.0",
      "date": "2026-06-22",
      "summary": "初期package scaffold。slot / schema / TODOを追加。"
    }
  ]
}
```

## 新規TitleGameStudio作成時の雛形

```txt
titleGameStudios/<StudioName>
├─ index.html
├─ todo.html
├─ runtime-json-todo.html
├─ README.md
├─ studio.js
├─ todo.js
├─ runtime-json-todo.js
├─ styles.css
└─ package
   ├─ title-game-studio.package.json
   ├─ slots
   └─ schemas
```

## 2D_SRPGStudioへの適用

- Studio名: `2D_SRPGStudio`
- packageId: `title_game_studio_2d_srpg_001`
- packageVersion: `0.1.0`
- latest: `true`
- package manifest: `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\titleGameStudios\2D_SRPGStudio\package\title-game-studio.package.json`
