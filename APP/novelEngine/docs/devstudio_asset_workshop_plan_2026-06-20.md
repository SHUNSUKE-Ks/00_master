# DevStudio Asset Workshop Plan 2026-06-20

meta:
  date: 2026-06-20
  agent: codex
  topic: DevStudio Character / Background generation and processing workshop plan
  status: planned
  target: C:\00_master\APP\novelEngine
  report_type: planning

summary:
- DevStudio内にCharacter工房、Background工房、背景処理/透過確認工房を追加する。
- 参考元は `C:\202604_claude_workspace\100_gamecollection` の ImageStudio v1.0。
- novelEngineでは、まず生成API連携ではなく、発注JSON、素材登録、透過チェック、差し替え確認を優先する。

reference:
- old_project: C:\202604_claude_workspace\100_gamecollection
- image_studio_docs: C:\202604_claude_workspace\100_gamecollection\Document\studio\Opus_WorkSpace\ImageStudio_v1.0
- reusable_component: C:\202604_claude_workspace\100_gamecollection\src\parts\image-studio
- sample_character_prompts: C:\202604_claude_workspace\100_gamecollection\public\codex-inbox\image-studio\nanonovel_sample_town\2026-05-27_npc_light_set\CharacterPrompts.json
- sample_background_prompts: C:\202604_claude_workspace\100_gamecollection\public\codex-inbox\image-studio\nanonovel_sample_town\2026-05-27_village_bg_time_set\BackgroundPrompts.json

decisions:
- 旧工房はReact/Zustand前提なので、コード丸ごと移植しない。
- StyleSheet、PromptSlot、OrderSheet、GenerationHistoryの考え方をSolidJS版DevStudioへ移植する。
- CharacterとBackgroundは同じ工房に混ぜすぎず、タブまたはレーンで分ける。
- 透過処理は自動処理だけで完結させず、検査、比較、手動修正待ちを状態として持つ。
- Demo画像と本番Cutout画像は別パスで管理する。

target_structure:
- src:
  - C:\00_master\APP\novelEngine\src\DevStudio\AssetWorkshop
  - C:\00_master\APP\novelEngine\src\DevStudio\AssetWorkshop\AssetWorkshop.jsx
  - C:\00_master\APP\novelEngine\src\DevStudio\AssetWorkshop\AssetWorkshop.css
  - C:\00_master\APP\novelEngine\src\DevStudio\AssetWorkshop\assetWorkshopData.js
- data:
  - C:\00_master\APP\novelEngine\src\data\assetWorkshop\style_sheets.default.json
  - C:\00_master\APP\novelEngine\src\data\assetWorkshop\prompt_slots.default.json
  - C:\00_master\APP\novelEngine\src\data\assetWorkshop\generation_history.default.json
- assets:
  - C:\00_master\APP\novelEngine\public\assets\packs\fantasy_novel_default\characters_raw
  - C:\00_master\APP\novelEngine\public\assets\packs\fantasy_novel_default\characters_demo
  - C:\00_master\APP\novelEngine\public\assets\packs\fantasy_novel_default\characters_cutout
  - C:\00_master\APP\novelEngine\public\assets\packs\fantasy_novel_default\objects_raw
  - C:\00_master\APP\novelEngine\public\assets\packs\fantasy_novel_default\objects_cutout
  - C:\00_master\APP\novelEngine\public\assets\packs\fantasy_novel_default\backgrounds_raw
  - C:\00_master\APP\novelEngine\public\assets\packs\fantasy_novel_default\backgrounds_processed
- scripts:
  - C:\00_master\APP\novelEngine\scripts\check-character-alpha.mjs
  - C:\00_master\APP\novelEngine\scripts\check-background-assets.mjs
  - C:\00_master\APP\novelEngine\scripts\prepare-asset-workshop-folders.mjs

asset_path_policy:
- `raw`: 生成直後または受領直後。背景あり、市松模様あり、未加工を許容する。
- `demo`: DevStudioやSampleで見せる仮確認用。背景状態のままでもよい。
- `cutout`: 本番Runtimeで使うCharacter / Objectのみの透過PNG。
- `processed`: 背景の明度、比率、ぼかし、UI安全領域などを整えた本番候補。
- `legacy`: 旧素材を残す場合の退避先。Runtime参照には使わない。

screen_plan:
- Dashboard card:
  - 今日の生成待ち
  - 透過NG
  - 本番差し替え待ち
  - 背景処理待ち
- Character Workshop:
  - Character DB一覧
  - raw / demo / cutout 比較
  - alpha検査結果
  - 市松模様残り警告
  - face icon / standing / costume / hair slot確認
  - cutoutPathをDBへ採用するボタン
- Background Workshop:
  - raw / processed 比較
  - PC横 / Android縦 / Safe Area preview
  - 明度、ぼかし、dialogue contrast確認
  - time-of-day差分管理
- Prompt Workshop:
  - StyleSheet切替
  - PromptSlot編集
  - Character / Background発注JSONコピー
  - OrderSheet JSON import
- History:
  - 生成履歴
  - accepted / rejected / pending
  - 生成元prompt、seed、styleSheet、保存先

processing_plan:
- P0 Inspect:
  - 旧ImageStudio資料をnovelEngine用に整理する。
  - 現在のCharacter PNGのalpha率、透明領域、背景残りを検査する。
- P1 Folder / DB:
  - raw/demo/cutout/processedフォルダを作る。
  - `dev_library.default.json` に `demoPath`、`cutoutPath`、`processingStatus` を追加する案を作る。
- P2 DevStudio UI:
  - DevStudioに `Workshop` タブを追加する。
  - Character / Background / Prompt / History のサブビューを作る。
  - 最初はファイル書き込みなし。JSON表示とコピー、状態確認だけにする。
- P3 Check Scripts:
  - `check-character-alpha.mjs` で透過率、半透明、外周不透明を検査する。
  - `check-background-assets.mjs` で解像度、比率、ファイル存在、容量を検査する。
- P4 Cutout Experiment:
  - 1枚だけ自動切り抜きテストをする。
  - 市松模様除去、自動背景除去、手動修正のどれが必要か判断する。
- P5 Adoption Flow:
  - cutout候補をDBへ採用する形式を決める。
  - Runtimeは `cutoutPath` を優先、無ければ `demoPath`、最後に `assetPath` の順でfallbackする。

automation_policy:
- ブラウザだけではローカルファイルへの直接保存はしない。
- ファイル生成/加工はNode scriptまたは外部工房で行う。
- DevStudioは状態確認、発注、採用判断、Report化を担当する。
- 背景除去が難しい素材は `needs_manual_cutout` として止める。

manual_workshop_needed:
- 髪先、マント、半透明エフェクトがあるCharacter。
- 銀鎧や白服など、市松背景と近い色の素材。
- 影や光が背景に焼き込まれている素材。
- 本番品質の輪郭が必要なCharacter / Object。

schema_candidate:
```json
{
  "assetProcessing": {
    "rawPath": "/assets/packs/fantasy_novel_default/characters_raw/char_knight_neutral.png",
    "demoPath": "/assets/packs/fantasy_novel_default/characters_demo/char_knight_neutral_demo.png",
    "cutoutPath": "/assets/packs/fantasy_novel_default/characters_cutout/char_knight_neutral_cutout.png",
    "status": "needs_cutout",
    "alphaCheck": {
      "hasAlpha": true,
      "transparentRatio": 0.1489,
      "edgeOpaqueWarning": true,
      "checkerboardSuspected": true
    },
    "manualRequired": true,
    "notes": "市松模様が焼き込まれているため、本番は手動確認が必要"
  }
}
```

tasktickets:
- TT-NE-WS-001: 旧ImageStudio資料をnovelEngine用に再整理する。
- TT-NE-WS-002: Asset Workshop用フォルダとDB案を作る。
- TT-NE-WS-003: Character Workshop UI scaffoldを作る。
- TT-NE-WS-004: Background Workshop UI scaffoldを作る。
- TT-NE-WS-005: alpha/background検査scriptを作る。
- TT-NE-WS-006: cutoutPath優先のRuntime fallback設計を作る。

verification:
- `npm run build`
- `npm run smoke:assets`
- `node scripts/check-character-alpha.mjs`
- DevStudioで raw / demo / cutout の表示差を確認する。

next:
- まず `TT-NE-WS-001` と `TT-NE-WS-002` から開始する。
- 実装前にDevStudio内Workshopの簡易レイアウトをHTMLまたはSample画面で確認する。
