# Kanban報告: Prompt Image Workshop 初期制作指示まとめ

作成日: 2026-07-04

対象: `Prompt Image Workshop`

保存先: `C:\00_master\DevApps\PromptImageWorkshop`

## 報告概要

Prompt Image Workshopは、NovelEngine / GameLabに画像生成責務を混ぜず、画像生成用prompt order、生成履歴、画像ライブラリ、採用候補、修正依頼、将来のAllAssetHub登録候補を扱う単独アプリ候補として初期設計した。

## 初期方針

1. NovelEngine DevStudioはprompt発注書コピー入口に留める。
2. 画像生成、生成履歴、画像ライブラリ、候補選定、マスク編集は本アプリ側へ分離する。
3. Tauri / Rust / Codex App Serverはすぐ実装せず、まず静的HTML、企画書、要件定義、DB設計を作る。
4. ローカル個人利用限定とし、外部公開はしない。
5. ComfyUIへ渡しやすいJSON/CSV形式を壊さない設計を優先する。

## 実装・設計済み

1. `README.md` に概要、表示方法、番号付き操作マニュアルを追加。
2. `docs/` に企画書、要件定義、Codex App Server学習メモ、i2i参照設計、tag/画像DB設計、DB relation設計を作成。
3. `screenLayout/index.html` に静的プロトタイプを作成。
4. ヘッダーのTitleロゴ/Titleプルダウンで `Current Workspace`、`Gallery: Future`、`Database` を切り替える構成に整理。
5. Current画面は初期画面として、prompt履歴、選択中prompt order、生成プレビュー、prompt入力、画像ライブラリを表示。
6. `selected prompt order` は初期状態を閉じにし、文頭の `▶` / `▼` で開閉するUIに変更。
7. 左右サイドバーを開閉式に変更。
8. DB画面はPC横画面で表が見えるよう、DBビュー時に右サイドバーを閉じる運用を想定。
9. tag filterセクションを上部に置き、検索窓のみ右寄せで配置。
10. `production column dict` として、全DBの本番想定カラムと日本語説明を辞書形式で表示。

## DB設計済みテーブル

1. `project_profiles`: 画風共通プロンプト、Character共通プロンプト、negative共通プロンプト。
2. `prompt_tag_dictionary`: 英語prompt語、日本語label、カテゴリ、同義語、双方向lookup。
3. `image_library`: 画像ファイル、英語ファイル名、日本語label、tagIds、状態、保存先。
4. `prompt_orders`: ComfyUIへ渡すprompt order JSON/CSV。
5. `reference_sources`: 既存画像フォルダー、構図/ポーズ参照、i2i参照パス。
6. `skills`: 差し替え可能な演出テンプレート。
7. `gallery_future`: Gallery future画面の接続予約。
8. `prompt_templates`: prompt order雛形。
9. `generation_runs`: 生成実行ログ。
10. `generated_candidates`: 生成候補。
11. `fix_request_log`: 修正依頼ログ。
12. `mask_edit_sessions`: 将来のマスク編集。
13. `comfyui_workflows`: ComfyUI workflow定義。
14. `model_presets`: model / quality / sampler等の設定。
15. `output_folders`: 保存先。
16. `file_watch_jobs`: ローカルファイル監視。
17. `allassethub_candidates`: AllAssetHub登録候補。
18. `app_settings`: ローカルアプリ設定。

## Future

1. Codex App Server連携。
2. ComfyUI画像生成実行。
3. 生成枚数指定の実処理化。
4. 既存画像フォルダーから構図/ポーズ参照するi2i生成。
5. mask edit。
6. local file watcher。
7. Tauri desktop化。
8. Rust画像検査。
9. AllAssetHub登録API。
10. Gallery完成後の接続。参照スレッド: `019f0d93-0b76-7320-bd16-89953550037f`

## Kanban向け状態

状態: 初期設計完了 / 静的プロトタイプ作成済み / Git初期化予定

次手:

1. Git初期化と初回commit。
2. BrowserでDB画面、tag filter、サイドバー開閉、prompt order開閉を確認。
3. Codex App Server学習用に、JSON/CSVを読み込む最小API境界を検討。
