# TT-NE-WS-002 Asset Workshop Paths Report 2026-06-20

meta:
  date: 2026-06-20
  task: TT-NE-WS-002
  project: APP/novelEngine
  status: done
  report_type: taskticket_report

## 要約

透明処理問題の初動として、Character素材を `raw / demo / cutout` の3レーンで扱えるようにした。
Kanban_June本体の更新先は `C:\00_master` 内で確認できなかったため、先に実作業とReport保存を行った。

## 実施

- `characters_raw`、`characters_demo`、`characters_cutout`、`backgrounds_processed` を作成した。
- 既存の `characters_safe` PNGを暫定の `demo` / `cutout` として複製した。
- `dev_library.default.json` に `demoPath`、`cutoutPath`、`processingStatus`、`assetProcessing` を追加した。
- Runtime表示を `cutoutPath -> demoPath -> assetPath` の順で解決するようにした。
- DevStudioのCharacter DB表示も同じ解決ルールへ寄せた。
- `smoke:assets` で demo/cutout の存在も検査するようにした。
- DevStudioのTicket一覧へ `TT-NE-WS-002` を追加した。

## 変更ファイル

- `APP\novelEngine\src\data\library\dev_library.default.json`
- `APP\novelEngine\src\utils\assets.js`
- `APP\novelEngine\src\screens\20_Novel\NovelScreen.jsx`
- `APP\novelEngine\src\DevStudio\DevStudio.jsx`
- `APP\novelEngine\src\DevStudio\devStudioData.js`
- `APP\novelEngine\scripts\smoke-assets.mjs`
- `APP\novelEngine\public\assets\packs\fantasy_novel_default\characters_demo`
- `APP\novelEngine\public\assets\packs\fantasy_novel_default\characters_cutout`
- `APP\novelEngine\public\assets\packs\fantasy_novel_default\characters_raw`
- `APP\novelEngine\public\assets\packs\fantasy_novel_default\backgrounds_processed`

## 検証

- `node -e "JSON.parse(...dev_library.default.json...)"`
- `npm run smoke:assets`
- `npm run build`

結果:
- JSON妥当性 OK
- character demo/cutout 存在 OK
- build OK
- 既存のSE未配置警告は継続。今回の透明処理とは別件。

## 残件

- 本物の未加工画像を `characters_raw` に入れる。
- 自動または手動の切り抜き結果を `characters_cutout` に採用する。
- `processingStatus` を `needs_cutout / cutout_ready / needs_manual_cutout / rejected` などへ整理する。
- Kanban_JuneのReport取り込み経路を修復する。

## Review 2026-06-21

- ノベルゲーム仮データでの読了テスト完了を確認した。
- `cutoutPath -> demoPath -> assetPath` のRuntime fallback方針は、仮データ再生の妨げになっていない。
- `TT-NE-WS-002` はdoneへ移動する。
