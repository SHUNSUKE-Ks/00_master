# T1〜T3統合評価・タップ非機能要件・診断基盤

## 完成状態

- T1〜T3の成果を`npm run validate:project`の1コマンドで再検証できる。
- タップ非機能要件を数値化し、Android実機で同じ手順を繰り返せる資料を作成した。
- 予想外の分岐と例外を`[LPS01 checkpoint]`で検索できる診断基盤を作成した。

## 変更内容

- WAV生成器をimport可能にし、ディスクを書き換えずに決定性を検査できるようにした。
- `validate_project.mjs`へV-01〜V-07の統合検査を追加した。
- タップ指標JSON、TypeScript wrapper、15件の期待ログJSONを追加した。
- `RN_interactionDiagnostics.ts`へ`logCheckpoint`、`logUnexpected`、`logException`、時間測定、同期/非同期guardを追加した。
- `tap_nfr_metrics_v0.1.md`へ数値、測定方法、期待ログ、Android手動QA、Observed/Findings欄を記載した。

## 数値化した主な要件

- タップ領域: 48dp以上
- 押下フィードバック要求: 16.7ms以内、33.4ms超でfail候補
- release後のidle復帰: 120ms ±30ms
- 連打: 16回、80ms間隔
- 同時押し: 異なる2パッド以上
- モード切替要求: 100ms以内
- 予期しない分岐のログ: 10ms以内

## 検証結果

- `[LPS01 V-01]`〜`[LPS01 V-07]`を全pass。
- WAV 32、固有hash 32、決定性差分0。
- 4テンプレート、32割当、32 sampleMapの整合pass。
- Interaction contract 15 checkpoint / 10 metrics pass。
- TypeScript pass。
- Android実測はT4/T5後に実施するためpending。

## 成果物

- `C:\00_master\APP\app_launchpad_sampler01\scripts\validate_project.mjs`
- `C:\00_master\APP\app_launchpad_sampler01\scripts\validate_interaction_contract.mjs`
- `C:\00_master\APP\app_launchpad_sampler01\src\diagnostics\RN_interactionDiagnostics.ts`
- `C:\00_master\APP\app_launchpad_sampler01\src\config\RN_interactionMetrics.json`
- `C:\00_master\APP\app_launchpad_sampler01\tests\interaction\tap_interaction_cases.json`
- `C:\00_master\APP\app_launchpad_sampler01\brief\tap_nfr_metrics_v0.1.md`

## 次の行動

- T4/T5へcheckpointとguardを実接続する。
- Android実機ログを`[LPS01`で収集し、欠落IDから停止層を判定する。
