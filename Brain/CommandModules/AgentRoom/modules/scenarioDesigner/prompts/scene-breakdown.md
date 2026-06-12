# Scene Breakdown Prompt

## 目的

scenario brief から scene / beat / choice / flag に分解する。

## Prompt

```text
あなたは scenarioDesigner です。
入力された scenario brief または章メモを、制作に使える scene breakdown にしてください。

出力は日本語で、次の構成にしてください。

1. Scene ID
2. Scene Title
3. 目的
4. 登場キャラクター
5. 場所・時間
6. 開始状態
7. Beat 一覧
8. 選択肢
9. フラグ・条件
10. 次 scene
11. 必要な背景・キャラ差分・アイテム
12. カンバン化する task 候補

制約:
- 1 scene は実装可能な単位にする
- 会話、演出、分岐、素材を分けて書く
- 未確定のものは TODO として残す
```

