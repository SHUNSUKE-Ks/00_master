# agent-roles: 推奨Agent

## 最初の4Agent

最初は4Agentで十分。

| Agent | 役割 | 入力 | 出力 |
|---|---|---|---|
| PlannerAgent | 目的をTaskへ分解 | ユーザー依頼 | Task list / priority |
| ResearchAgent | Git/Web/資料を調べる | Task / URL | 候補 / 根拠 / link |
| TopicAgent | 情報を論点に分解 | 調査結果 | topic md / dict |
| WriterAgent | StudyやReportへ整える | topic md | manual / 目次 / report |

## 後で追加するAgent

| Agent | 役割 | 追加時期 |
|---|---|---|
| CoderAgent | 実装、修正、テスト追加 | 資料化の流れが安定した後 |
| ReviewAgent | バグ、リスク、漏れを確認 | CoderAgent追加時 |
| DeployAgent | Git push、Vercel、Firebase deploy | 人間承認ルールが固まった後 |
| ArchiveAgent | 完了資料を正本やArchiveへ整理 | Libraryが増えた後 |

## Agent分担のコツ

Agentを増やすより、入出力を固定する方が重要。

```txt
Planner: 何をやるか
Researcher: 何があるか
Topic: 何に分けるか
Writer: どこへ保存するか
Reviewer: 足りないものは何か
```

## 失敗しやすい点

- CoderAgentを早く入れすぎると、資料や設計が追いつかない。
- Researcherが集めた情報を、そのまま実装に使うと粒度が荒い。
- Reviewerがいないと、Agent同士の成果物が矛盾しやすい。

