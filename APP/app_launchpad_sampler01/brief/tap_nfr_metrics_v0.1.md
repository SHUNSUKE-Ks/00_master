# タップ非機能要件・コンソール診断仕様 v0.1

作成: CODEX（2026-07-20）
対象: `app_launchpad_sampler01`
Console filter: `[LPS01`

## 1. 対象動作

ユーザーがパッドを押してから視覚状態と音声トリガーが要求され、指を離して通常状態へ戻るまでを、Android実機で再現可能な数値と番号付きログで観測する。

## 2. 数値化した受け入れ値

値の正は `src/config/RN_interactionMetrics.json` とする。本書は人向けの説明であり、検証スクリプトがJSONとの整合を確認する。

| ID | 指標 | 合格値 | 測定方法 |
|---|---|---:|---|
| NFR-TAP-01 | 最小タップ領域 | 幅・高さとも48dp以上 | `onLayout`で各有音パッドを測定 |
| NFR-TAP-02 | 押下フィードバック要求 | `onPressIn`から16.7ms以内 | 同一クロックで`1-1`から`1-3`を測定 |
| NFR-TAP-03 | 押下フィードバック警告 | 33.4ms超でfail候補 | 60Hz換算2フレームを超えたら`UNEXPECTED` |
| NFR-TAP-04 | 指を離した後の復帰 | 120ms ±30ms | `1-5`から`1-6`を測定 |
| NFR-TAP-05 | 連打耐性 | 16回、間隔80ms | 同一パッドを16回押してクラッシュ・入力停止0 |
| NFR-TAP-06 | 同時押し | 異なる2パッド以上 | `pressedPadIds`が同時に2 IDを含み、独立triggerを記録 |
| NFR-TAP-07 | モード切替要求 | 100ms以内 | `4-1`から`4-3`を測定 |
| NFR-TAP-08 | 空パッド副作用 | trigger 0回 | `3-1`だけが出て`1-4`が出ないこと |
| NFR-TAP-09 | 予期しない分岐の記録 | 10ms以内 | 同一イベント処理内で`UNEXPECTED`または`EXCEPTION`を出す |

`16.7ms`は60Hz表示の1フレーム相当であり、要件の「次フレームで確認できる」を実装側で測れる「フィードバック更新をスケジュールするまで」の時間へ写像した値である。実際のピクセル表示時刻は端末描画系を含むため、最終判定では動画または高速度撮影を補助証跡にする。

## 3. 期待ログ

### 単一パッド

- [ ] `1-1` onPressIn received
- [ ] `1-2` pressed state requested
- [ ] `1-3` visual feedback scheduled
- [ ] `1-4` audio trigger requested
- [ ] `1-5` onPressOut or cancel received
- [ ] `1-6` idle reset completed

### 同時押し

- [ ] `2-1` second pad onPressIn received
- [ ] `2-2` simultaneous pressed IDs confirmed
- [ ] `2-3` independent player overlap requested

### 例外・不正入力

- [ ] `3-1` empty or unknown pad ignored
- [ ] `3-2` unexpected branch logged with context
- [ ] `3-3` exception contained or rethrown by policy

### モード切替

- [ ] `4-1` mode selection received
- [ ] `4-2` mode state update requested
- [ ] `4-3` mode panel render scheduled

期待ケースの機械可読正本は `tests/interaction/tap_interaction_cases.json` とする。

## 4. 例外処理方針

- 通常境界は`console.log`、仕様外だが継続可能な動作は`console.warn`、例外は`console.error`を使う。
- すべて`[LPS01 <checkpoint>]`、ラベル、padId/templateId/mode、測定値を含める。
- 例外は`RN_interactionDiagnostics.ts`の`runGuarded`または`runGuardedAsync`を通し、エラー名・メッセージ・stackを記録する。
- 音声トリガー失敗など継続可能な処理はfallbackで画面操作を継続する。
- データ破損や契約違反は`rethrow: true`として開発時に停止させる。
- 通常ログは開発ビルドだけ、`UNEXPECTED`と`EXCEPTION`は常に出力する。

## 5. Android実機チェック手順

前提: T4の音声層とT5のパッド画面が実装済みであること。

1. `C:\00_master\APP\app_launchpad_sampler01`で`npx expo start --clear`を手動実行する。
2. Android Expo GoでQRコードを開く。
3. Metroログを`[LPS01`で確認する。
4. HipHopのKICKを1回押して離し、`1-1`〜`1-6`を確認する。
5. KICKとSNAREを同時に押し、`2-1`〜`2-3`と音の重なりを確認する。
6. 空パッドを押し、`3-1`だけが出て音が鳴らないことを確認する。
7. 80ms間隔を目安に同一パッドを16回連打し、停止・クラッシュ・押下状態の固着がないことを確認する。
8. 4モードを切り替え、各回`4-1`〜`4-3`が100ms以内であることを確認する。
9. `[LPS01`で始まるログだけを保存し、検証シートへ貼り付ける。

## 6. 現在までの評価

| フェーズ | 結果 | 証跡 |
|---|---|---|
| T1 Expo scaffold | pass | TypeScript、Expo Doctor、Android実機表示 |
| T1 SDK互換性是正 | pass | SDK 54、Expo Go起動、Metro bundle完了 |
| T2 WAV生成 | pass | 32ファイル、32固有hash、2回生成差分0、PCM形式 |
| T3 データ契約 | pass | 4テンプレート、32割当、32 sampleMap、座標・配色整合 |
| タップ実測 | pending | T4/T5実装後に本書§5を実施 |
| T4〜T7実装・静的検証 | pass | `RN_padPlayer`、48セルグリッド、15 checkpoint、V-08 |

## 7. Observed / Findings

実測時に以下へ記録する。

```text
Observed:
Missing:
Likely stop: event / store / audio / animation / render
Next check:
```

実機の記入用正本は `tests/interaction/tap_manual_checklist.md` とする。実測値を得るまでは、本書の数値は受け入れ基準であり、達成済みの実測値ではない。
