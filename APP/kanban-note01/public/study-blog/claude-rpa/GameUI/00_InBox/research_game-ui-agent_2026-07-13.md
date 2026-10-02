# 研究候補: GameUIAgent

一言: 自然言語をDesign Spec JSONへ変換し、編集可能なFigma UIを生成してVLMで修正する研究。

## Dict

| 用語 | 定義 |
|---|---|
| 自動意匠 | 自然言語からゲームUI設計を生成する仕組み |
| 中間表現 | 自然言語と描画処理の間に置くDesign Spec JSON |
| 視覚反省 | ScreenshotをVLMで評価し、悪化させずに修正するLoop |

## Noteへの適用

```text
自然言語 -> ui_spec.json -> SolidJS / Figma -> Screenshot -> Review -> 修正
```

完成製品としてではなく、GameUIDesignerAgentのStateと出力契約を設計する資料として扱う。
