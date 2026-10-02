# overview: ai-orchestratorとは何か

## 位置づけ

`ai-orchestrator` は、単一のOSS名というより **複数AIをどう指揮するか** のジャンル。
GitHub Topicとして見ると、Agent、Task、Workflow、Queue、Memory、Tool連携の設計候補が集まる棚になる。

## 全体構造

```txt
User
 ↓
Orchestrator
 ↓↓↓↓↓
Planner
Researcher
Coder
Reviewer
Writer
 ↓
Result
```

人間組織に置き換えると、社長、部長、社員の関係に近い。
ただしAIでは、社長も部長も社員も同じLLMを別ロールで使うことが多い。

## 重要な問い

Multi-Agentで最初に決めるべきことは、Agent数ではない。
次の5つを決めること。

| 問い | 内容 |
|---|---|
| 何を分解するか | User requestをTaskへ落とす |
| 誰がやるか | Agent roleを決める |
| どこで待つか | Queue / Kanban / rpaJobs |
| どこに書くか | File / DB / Report / Study |
| 誰が確認するか | Review / Test / Human approval |

## このTopicがCreatorHubに合う理由

現在の作業はすでに次の流れになっている。

```txt
Git検索
-> Topic化
-> Library化
-> Skill化
-> 実装
```

これは単なるAIチャットではなく、情報収集、構造化、再利用、実装を回す **Knowledge Factory** に近い。

