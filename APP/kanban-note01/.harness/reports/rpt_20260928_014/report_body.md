# 会話ログの録音を ZIP で書き出す（2026-09-28）

## 依頼
ZIP の中に音声と、それを並べた JSON を入れ、将来テキストと結び付けられる仕組みを用意しておく。今はその場で録音して再生できれば十分。納品の仕組みは novelEngine に納品するときにあらためて作る。

## できたこと
- 会話ログの見出しに「ZIP で書き出し」。ページ（範囲）の録音をまとめてダウンロードする。
- ZIP の中身:
  - `voices.json`（`note_story.voice_pack.v0.1`）
  - `voice/001.webm` …（番号＝書き出し時点のセリフの順番）、合わない録音は `voice/unmatched_001.webm` …
- `voices.json` の1件: file・lineNo・speaker・text・pillar（直前の柱）・textHash・occurrence・recordedText（録音したときの文）・textChangedAfterRecording・mime・durationMs・recordedAt・device・matched
- 結び方（`link` に説明を入れた）: 文の指紋（textHash）と、同じ文の何番目か（occurrence）。話者名は使わない。lineNo は書き出した時点の番号で、本文を書き換えるとずれる。

## 確かめたこと
- 型チェック・本番ビルド成功。
- jsdom 16本すべて PASS（計472件）。書き出した ZIP を Python の zipfile で開き、CRC と中身を確認。

## 残り
- novelEngine へ納品するときに、voices.json から本文と結び直す（そのとき作る）。
