# knowledge-factory: 知識工場

## 定義

Knowledge Factoryは、情報を集めて終わりではなく、再利用できる形に加工して実装へ渡す流れ。

```txt
情報収集
-> 構造化
-> Library化
-> Skill化
-> 実装
```

## 今の作業との対応

| 現在の作業 | Knowledge Factory内の役割 |
|---|---|
| Git検索 | 情報収集 |
| OSS候補md | 初期索引 |
| RPA資料 | 構造化 |
| Studyカード | Library化 |
| 漢字概念 | 自分用理解 / RAG補助 |
| Codex依頼 | 実装入口 |
| Kanban報告 | 状態と履歴 |

## Agent構成

```txt
ResearchAgent
  Git / Webから候補を集める

TopicAgent
  内容を見出し、Dict、topicsへ分ける

WriterAgent
  manual.md / 目次.md / topics/*.mdへ保存する

ReviewAgent
  足りない項目、重複、古い情報を確認する
```

## 重要

この流れは、AIチャットの回答を保存するだけではない。
後で自分、Codex、Claude、localAIが再利用できる形に資料を変換することが目的。

