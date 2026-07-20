# T2 決定的プレースホルダWAV生成完了

## 完成状態

- 32個の同梱用WAVを、外部素材・外部依存なしで自前合成した。
- 同じスクリプトを何度実行しても同じバイナリになる決定性を確認した。
- 4テンプレートの最低8音をT3のテンプレートJSONから参照できるファイル名で準備した。

## 変更内容

- `scripts/gen_placeholder_wavs.mjs`を追加した。
- `assets/samples/`へRock、Jazz、Drum & Bass、HipHop向け32 WAVを生成した。
- `assets/samples/LICENSES.md`にCC0、生成方法、収録音色を記録した。
- 同じ合成式でもテンプレートごとに波形が重複しないよう、ファイル名ハッシュから決まる微小なデチューンを加えた。

## 検証結果

- 32ファイル、32 unique SHA-256 hashes。
- 2回の再生成でhash差分0。
- 先頭ファイルのヘッダーを確認: RIFF/WAVE、PCM format code 1、mono、44100Hz、16-bit。
- `Math.random`は使用せず、ファイル名ハッシュをseedにした自作PRNGだけを使用。
- Android実機でのパッド再生はT4/T5の実装後に行う。現時点では音源ファイル単体の機械検証まで完了。

## 成果物

- `C:\00_master\APP\app_launchpad_sampler01\scripts\gen_placeholder_wavs.mjs`
- `C:\00_master\APP\app_launchpad_sampler01\assets\samples\LICENSES.md`
- `C:\00_master\APP\app_launchpad_sampler01\assets\samples\`（WAV 32ファイル）

## 次の行動

- T3としてデータ型、4テンプレートJSON、静的sampleMap、テンプレート検証スクリプトを実装する。
- T4/T5後にAndroid実機で再生と同時発音を検証する。
