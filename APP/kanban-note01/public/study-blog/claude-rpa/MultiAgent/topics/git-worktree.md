# git-worktree: 複数Agentの作業場

## なぜWorktreeが必要か

複数Agentが同じファイルを同時に触ると壊れやすい。
そこでGit Worktreeを使い、Agentごとに作業場を分ける。

```txt
main
worktree_planner
worktree_coder
worktree_reviewer
worktree_docs
```

## メリット

| 項目 | 効果 |
|---|---|
| 衝突回避 | 同じファイルを同時に壊しにくい |
| 比較 | Agentごとの差分を見られる |
| 破棄 | 失敗した作業場だけ捨てられる |
| 並列 | Research / Coder / Docsを同時に進めやすい |

## CreatorHubでの使い方

```txt
CreatorHub/
  main
  worktrees/
    planner/
    research/
    coder/
    review/
```

## 注意

- Worktreeは便利だが、最初から必須ではない。
- まずは単一作業場でPlanner -> Research -> Writerを安定させる。
- CoderAgentが増えた段階でWorktreeを導入する。

