# queue-state-workflow: Queue / State / Workflow

## Queue

Task Queueは、Agentが次に何をすべきかを読む場所。
Noteでは `rpaJobs`、Kanban、InBoxがQueueの候補になる。

```txt
未着手
実行依頼
確認中
Library化済み
保留
失敗
```

## State

Stateは「現在地」。
MultiAgentでは、TaskだけでなくAgent自身にもStateが必要。

| 対象 | State例 |
|---|---|
| Task | 未着手 / 実行依頼 / 確認中 / 完了 |
| Agent | idle / running / blocked / done |
| Artifact | draft / review / accepted / archived |
| Tool | available / error / auth_required |

## Workflow

Workflowは、状態がどう進むかの道。

```txt
User request
-> Task化
-> Queue登録
-> Agent割当
-> 実行
-> 成果物保存
-> Review
-> Report
```

## Noteでの現実的な初期構成

最初はFirebaseに全部寄せず、以下でもよい。

```txt
local JSON / Firebase
  rpaJobs

Markdown
  Study
  Report
  Archive

UI
  Study DB View
  Kanban
```

ただしCodexが読むためには、localStorageだけでは弱い。
Codex側の監視コマンドに読ませるものは、FirebaseかローカルJSONに出す。

