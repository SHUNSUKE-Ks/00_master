# Android物理端末Expo Go互換性の是正

## 完成状態

- Android物理端末で発生した「Project is incompatible with this version of Expo Go」の原因をSDK 57と配布版Expo Goの非互換と確定した。
- G4のAndroid実機Expo Go検証を優先し、プロジェクトをSDK 54へ暫定固定した。
- 依存同期、型検査、Expo Doctor、権限確認まで完了した。

## 変更内容

- `expo`を`~54.0.0`へ変更し、`npx expo install --fix`で関連依存をSDK 54互換版へ同期した。
- React Native 0.81.5、React 19.1.0、expo-audio 1.1.1、Reanimated 4.1系、Worklets 0.5.1、TypeScript 5.9系へ整合した。
- `app.json`で`microphonePermission: false`、`recordAudioAndroid: false`を設定し、録音対象外のMVPへ不要なマイク権限を除外した。
- RN初期設計書とDEVBOARDへSDK 54暫定固定の理由を追記した。

## 検証結果

- `npx expo config --type public`: `sdkVersion: 54.0.0`、Android権限は`MODIFY_AUDIO_SETTINGS`のみ。
- `npx expo install --check`: pass。
- `npx expo-doctor`: 18/18 pass。
- `npm run typecheck`: pass。
- `npm audit --omit=dev --audit-level=high`: high以上0、moderate 11。force修正はSDK 57へ戻るため未適用。
- Android実機での再接続確認はユーザーによるMetro再起動後に実施する。

## 成果物

- `C:\00_master\APP\app_launchpad_sampler01\package.json`
- `C:\00_master\APP\app_launchpad_sampler01\package-lock.json`
- `C:\00_master\APP\app_launchpad_sampler01\app.json`
- `C:\00_master\APP\app_launchpad_sampler01\brief\rn_initial_design_v0.1.md`
- `C:\00_master\APP\app_launchpad_sampler01\DEVBOARD.md`

## 次の行動

- Metroをキャッシュクリア付きで手動再起動し、Android Expo GoからQRコードを読み直す。
- 接続成功後、T2へ進む。
