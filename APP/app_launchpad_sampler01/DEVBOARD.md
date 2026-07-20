# DEVBOARD — app_launchpad_sampler01（Launchpad風ドラム・サンプラー）

最終更新: 2026-07-20 CODEX

## 現在地

- フェーズ: **T1 Expo scaffold完了＋Android物理端末Expo Go互換性是正完了**。T2未着手。
- 次の一手: CODEXが `brief/rn_initial_design_v0.1.md` の段階2（T2）として、決定的プレースホルダWAV生成スクリプト、32音、`assets/samples/LICENSES.md`を作成する。

## 資料の正

| 種類 | ファイル |
|---|---|
| 要件定義（正） | `brief/requirements_launchpad_sampler01.md` |
| 設計書 v0.1（凍結） | `brief/design_mvp_v0.1.md` |
| UI参照パーツ辞書 | `brief/ui_reference_launchpad_ipad.md` |
| デザインモック（機能なしHTML、レイアウト仕様として実装が踏襲） | `brief/mockup/screen_mock_v0.1.html`（共有複製: `C:\00_master\MockUp\app_launchpad_sampler01\`） |
| **CODEX引継ぎ資料** | `brief/handover_to_codex_v0.1.md` |
| **RN初期設計・実装順序・受け入れテスト** | `brief/rn_initial_design_v0.1.md` |
| 差し戻しログ | `brief/spec_return_log.md` |
| 検証シート（T8で作成） | `reports/report_launchpad_mvp_v0.1_verification.md` |

## 決定事項ログ

- 2026-07-20 D1..D10 を設計書v0.1で凍結（Zustand採用 / expo-audio 1パッド1プレイヤー / JSON1ファイル正 / 音源はseed付き自前合成CC0 / screen_templateは作らない / ルーター不使用 ほか）
- 2026-07-20 スクショ5枚をテキスト化し以後は `ui_reference_launchpad_ipad.md` を読む（画像は読み直さない）
- 2026-07-20 機能なしのHTMLデザインモック v0.1 を作成（screen_home + screen_pad、48パッド、4モード）。`C:\00_master\MockUp\app_launchpad_sampler01\` へ複製保存。この作業をスキル化（`planner-html-mockup`、`.claude/skills/`）
- 2026-07-20 開発担当をSonnet/Opus分担からCODEXへ変更。引継ぎ資料作成（`handover_to_codex_v0.1.md`）。RN実装はモックのレイアウト・配色・状態表現を1:1踏襲し、UIコンポーネント/RN固有実装ファイルは`RN_`接頭辞を付与すること
- 2026-07-20 CODEXがRN初期設計、8段階の実装順序、AT-01〜10・MT-01〜18の受け入れテストを `brief/rn_initial_design_v0.1.md` に確定。T4までSol、T5以降Terra移行可、重要判断と最終受け入れはSolとする
- 2026-07-20 T1完了。Expo SDK 57 + TypeScript strictをプロジェクト直下へ構成し、expo-audio / Zustand / AsyncStorage / Reanimated / WorkletsをExpo互換版で導入。Expo Doctor 20/20、tsc 0エラー
- 2026-07-20 Android物理端末の配布版Expo GoがSDK 57未対応であることを実機確認。G4のExpo Go検証を優先してSDK 54へ暫定固定し、全依存を互換版へ同期。録音対象外のためマイク権限も無効化。SDK 54環境でExpo Doctor 18/18、tsc 0エラー
- 2026-07-20 Android実機（Expo Go）でSDK 54 scaffoldを表示確認。Metroの`Android Bundled`完了と、黒背景の`LAUNCHPAD SAMPLER / T1 scaffold ready`表示を確認

## 未完タスク

| T# | 内容 | 担当 | 状態 |
|---|---|---|---|
| T1 | Expo scaffold + 依存 + .gitignore | CODEX | **完了** |
| T2 | プレースホルダWAV合成スクリプト＋32音生成＋LICENSES.md | CODEX | 未着手 |
| T3 | types.ts + system_templates.json + sampleMap.ts + validate_templates.mjs | CODEX | 未着手 |
| T4 | audio/RN_padPlayer.ts（中核契約） | CODEX | 未着手 |
| T5 | RN_ScreenPad（8×6グリッド＋再生＋点灯） | CODEX | 未着手 |
| T6 | RN_ModeRail + RN_FaderPanel + RN_FxPanel（UI状態のみ） | CODEX | 未着手 |
| T7 | RN_ScreenHome + AsyncStorage永続化 | CODEX | 未着手 |
| T8 | 検証 V1..V4 + 検証シート | CODEX | 未着手 |

## 受け入れ基準（要約。詳細は設計書§0）

G1 tsc 0エラー ／ G2 validate_templates.mjs exit 0 ／ G3 WAV生成の決定性（2回diff空） ／ G4 Android実機チェックリスト8項目 ／ G5 生成物のgit混入なし

## 検証記録

- 2026-07-20 T1: `npm run typecheck` pass、`npx expo install --check` pass、`npx expo-doctor` 20/20 pass、node_modules/.expo/dist/web-buildのignore確認。npm auditはhigh以上0、Expo内部依存由来moderate 10（破壊的なforce更新は未適用）
- 2026-07-20 T1是正: `sdkVersion: 54.0.0`確認、`npx expo install --check` pass、`npx expo-doctor` 18/18 pass、`npm run typecheck` pass。npm auditはhigh以上0、Expo内部依存由来moderate 11（force更新はSDK 57へ戻す破壊的変更のため未適用）
- 2026-07-20 T1 Android実機: Expo GoからMetro（`exp://192.168.0.7:8081`）へ接続し、`Android Bundled 19811ms index.ts (686 modules)`を確認。端末画面でscaffoldの描画を確認
