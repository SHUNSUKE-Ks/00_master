# autopilot: リポジトリ自走サービス（Autopilot）

対象ファイル（実読）:
- `src/openharness/autopilot/types.py`（91行）
- `src/openharness/autopilot/service.py`（先頭100行、2239行中 — リポジトリ最大級のファイル）

## 何のモジュール群か

「issueやアイデアを受け付け→スコアリング→承認→worktreeで実行→検証→PR作成→CI待ち→必要なら修復→マージ」まで、リポジトリレベルの改善作業を自動運転させるサービス。README中の`ClawTeam` Integration (Roadmap) や「Multi-agent prototype harness for task delegation and background execution」に対応する、最も自律度の高いサブシステム。`ohmo_request`（ohmo経由の依頼）・`manual_idea`・`github_issue`・`github_pr`・`claude_code_candidate`という複数の入力源を「統一キュー」として扱う設計。

## 主要ファイル

- `src/openharness/autopilot/types.py` — `RepoTaskCard` / `RepoJournalEntry` / `RepoAutopilotRegistry` / `RepoRunResult` / `RepoVerificationStep`のPydanticモデル群
- `src/openharness/autopilot/service.py` — 上記モデルを操作するintake・スコアリング・実行・検証・修復ロジック本体（2239行）

## 設計のポイント

### RepoTaskStatusのステートマシン（types.py実読）

```
queued → accepted → preparing → running → verifying
  → pr_open → waiting_ci → repairing → completed → merged
  （または failed / rejected / superseded）
```

13状態の明示的なステートマシンとして定義されており、`repairing`状態が独立している点が特徴（検証失敗やCI失敗を「即failedにせず、限定回数だけ自動修復を試みる」設計を示唆）。

### スコアリングと既定ポリシー（service.py先頭実読）

`_SOURCE_BASE_SCORES`で入力源ごとに基礎スコアを持つ:

| source_kind | 基礎スコア |
|---|---|
| ohmo_request | 100（最優先） |
| github_pr | 85 |
| manual_idea | 80 |
| github_issue | 75 |
| claude_code_candidate | 45（最低。AIが自発的に見つけた改善案は人間発の依頼より優先度を下げる） |

`_BUG_HINTS`（bug/fix/failure/broken/regression/crash/error/issue）や`_URGENT_HINTS`（urgent/p0/p1/high/critical/blocker）というキーワード集合でタイトル・本文からスコアを加点すると推測される（実装本体は未実読）。

`_DEFAULT_AUTOPILOT_POLICY`の既定値から読み取れる安全設計:
- `decision.default_human_gate = True` — **既定では人間の承認ゲートを必須とする**（AIが勝手に採否を決めない）
- `execution.use_worktree = True` — 実行は必ずgit worktree分離（本体ブランチを汚さない）
- `execution.max_attempts = 3` — 実行の再試行上限
- `github.auto_merge.mode = "label_gated"` — **自動マージはラベル（`autopilot:merge`）が付与された場合のみ**という明示的なオプトイン設計
- `repair.max_rounds = 2`、かつ`repair.stop_on`に`agent_runtime_error` / `git_error` / `permission_error` / `merge_conflict`を明示 — これらのエラー種別は自動修復を試みず即座に停止する

`_DEFAULT_VERIFICATION_POLICY`の`gates: [fast_gate, repo_gate, harness_gate]`＋`commands`（`uv run pytest -q`, `uv run ruff check ...`等）から、検証は複数段のゲートとコマンド列の組み合わせで構成されることが分かる。

## CreatorHub運用への示唆

- 「AIが自発的に見つけた改善候補（claude_code_candidate）はスコアを最も低く設定し、人間発の依頼を常に優先する」という優先度設計は、このセッション自身が使っている`spawn_task`（out-of-scopeの気づきをチップとして提案するだけで即実行しない仕組み）と思想が一致する。CreatorHubの企画立案（project-manager agentが横断的に気づきを`02_Output`へ書き出す運用）にも「AI発の提案は人間承認ゲートを必須にする」という同じ原則が既に採用されている。
- `repair.stop_on`のように「自動修復を試みてよいエラー種別」と「即座に人間へエスカレーションすべきエラー種別」を明示的にリスト化する設計は、CreatorHubの自走ループ（`90_Loop/run_agent.ps1`）が将来エラー発生時の自動リトライ範囲を設計する際の具体的なテンプレートになる。
- `label_gated`な自動マージ（特定ラベルが付いた場合のみ自動化を許可）は、CreatorHubのTaskBoardで「検収まで自動化してよいタスク」を明示的にマーキングする仕組みを検討する際の参考になる。

TUI/Cronについては[topics/ui_cron.md](ui_cron.md)を参照。
