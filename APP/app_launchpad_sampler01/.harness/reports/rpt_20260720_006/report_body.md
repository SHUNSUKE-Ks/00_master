# T3 テンプレートデータ契約・検証スクリプト完了

## 完成状態

- 4テンプレートと32 WAVの対応をJSON・TypeScript・実ファイルの3層で固定した。
- React Nativeの静的`require()`制約に合わせ、32ファイル全てを`sampleMap.ts`へ明示した。
- G2相当のデータ整合を依存なしのNodeスクリプトで確認できる状態にした。

## 変更内容

- `src/data/RN_types.ts`にデータ型を定義した。
- `src/data/system_templates.json`に各テンプレート8パッドを定義した。
- `src/data/sampleMap.ts`に32 WAVの静的マップを追加した。
- `scripts/validate_templates.mjs`にテンプレート、WAV、sampleMap、座標、カテゴリ配色の検査を実装した。

## 検証結果

- `node scripts/validate_templates.mjs`: pass。
- Templates=4、Assigned pads=32、Referenced samples=32、Static sampleMap keys=32。
- `node --check scripts/validate_templates.mjs`: pass。
- `npm run typecheck`: pass。

## 成果物

- `C:\00_master\APP\app_launchpad_sampler01\src\data\RN_types.ts`
- `C:\00_master\APP\app_launchpad_sampler01\src\data\system_templates.json`
- `C:\00_master\APP\app_launchpad_sampler01\src\data\sampleMap.ts`
- `C:\00_master\APP\app_launchpad_sampler01\scripts\validate_templates.mjs`

## 次の行動

- T4で`RN_padPlayer.ts`の音声ライフサイクルを実装する。
- T5でHipHopパッドを接続し、Android実機で再生と同時発音を確認する。
