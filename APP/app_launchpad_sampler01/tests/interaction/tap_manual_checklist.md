# Android タップ・音声 実機確認表（T4〜T8）

総合進捗: 0 / 8（実機未測定）
対象: Launchpad Sampler / Android Expo Go
Console filter: `[LPS01`

## 実行前

- [ ] `C:\00_master\APP\app_launchpad_sampler01`で `npx expo start --clear` を手動実行した
- [ ] Android端末とPCが同一ネットワークにあり、Expo GoでQRコードを開いた
- [ ] Metroに `Android Bundled` が表示された

## T4〜T5 パッド・音声

- [ ] MT-02: HipHopの8有音パッドを各1回押し、対応する音が鳴った。期待ログ: `1-1`〜`1-6`、`1-4`
- [ ] MT-04: KICKとSNAREを同時押しし、両方が重なった。期待ログ: `2-1`、`2-2`、`2-3`
- [ ] MT-05 / NFR-TAP-05: KICKを80ms目安で16回連打しても、クラッシュ・入力停止・押下固着がなかった
- [ ] MT-06 / NFR-TAP-02〜04: 押下時に縮小・点灯し、離して120±30msで通常色へ戻った。期待ログ: `1-3`、`1-6`
- [ ] MT-07 / NFR-TAP-08: 空パッドで音と点灯が出ず、`3-1`だけが出た

## T6 操作パネル

- [ ] MT-08〜09: パッド/フィルター/音量/FXを切替え、各々`4-1`〜`4-3`が出た。filter・volumeの8フェーダー、FXの16カードを操作できた

## T7 テンプレート保存

- [ ] MT-01 / MT-03: 4テンプレートを選択でき、各テンプレートで名前・配色・8音が切替わった。アプリ再起動後、前回テンプレートに「前回」バッジが出た

## 実測記録

| 項目 | 合格値 | 観測値 | Pass / Fail | 備考 |
|---|---:|---:|---|---|
| 押下フィードバック | 16.7ms以内 | 未測定 | pending | Metroログの`1-3 elapsedMs` |
| 離脱復帰 | 120±30ms | 未測定 | pending | `1-6 elapsedMs` |
| モード切替 | 100ms以内 | 未測定 | pending | `4-3 elapsedMs` |
| 最小タップ領域 | 48dp以上 | 未測定 | pending | `3-2`が出ないこと |
| 高速連打 | 16回 / 80ms | 未測定 | pending | クラッシュ・固着0 |
| 同時押し | 2パッド | 未測定 | pending | `2-1`〜`2-3`と重なり |

## Observed / Findings

```text
日時:
端末 / Android / Expo Go:
Observed:
Missing:
Likely stop: event / store / audio / animation / render
Next check:
```
