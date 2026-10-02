# swarm_multi_agent: マルチエージェント協調（swarm/coordinator）

対象ファイル（実読）:
- `src/openharness/swarm/team_lifecycle.py`（先頭70行、910行中 — 全ファイル中最大級）
- `src/openharness/coordinator/coordinator_mode.py`（先頭70行、520行中）
- `src/openharness/tools/agent_tool.py`（[tools.md](tools.md)参照）

## 2つのteam管理レイヤーが共存している

このリポジトリの特徴的な設計判断: **チーム管理が2系統ある**。

1. **`TeamRegistry`（coordinator/coordinator_mode.py）** — インメモリ、後方互換のために維持されていると docstring に明記（"kept for backward compatibility"）。`TeamRecord(name, description, agents, messages)`を`dict`で保持するだけの単純な実装。`create_team` / `delete_team` / `add_agent` / `send_message` / `list_teams`。プロセスが終われば消える。
2. **`TeamLifecycleManager`（swarm/team_lifecycle.py）** — ディスク永続化。`~/.openharness/teams/<name>/team.json` にJSONとして保存される。docstringに「TypeScript版`teamHelpers.ts`のAPIに完全対応させたPython実装」とあり、**この実装が元々TypeScript実装だった/併存している**ことを示唆（`sanitize_name`, `sanitize_agent_name`のコメントに`# Mirrors TS ...`と明記）。`AllowedPath`（team member全員が確認なしで編集できるパス、tool_name・added_by付き）などdisk上のチーム状態を扱う。

この2層は「同じ`coordinator_mode.py`内のインメモリ版を変更せずに、swarm側で永続版を横に追加した」という増築の跡が読み取れる。CreatorHubでも機能追加時に既存モジュールを壊さず併存させる judgment の実例として参考になる。

## AgentTool経由のspawn（[tools.md](tools.md)より再掲）

- モードは`local_agent` / `remote_agent` / `in_process_teammate`の3種類。
- 実装は常に`subprocess`バックエンドを使う（`in_process`はタスクツールから照会できないため）。
- `team`引数を渡すと`TeamRegistry.add_agent`（インメモリ版）に登録される。**`TeamLifecycleManager`（永続版）への登録はagent_tool.py内では行われていない**ため、真に永続的なチーム管理には別途`team_create_tool.py` / `team_delete_tool.py`（未実読）経由のフローがあると推測される。

## CreatorHubのOrchestra設計との対比

CreatorHubの3役agent（app-designer/app-builder/blog-researcher）は現状「TaskBoardのJSONファイル」を真実源としたファイルベースの受け渡し。OpenHarnessの`TeamLifecycleManager`も同様に「ディスク上のJSON（`team.json`）を真実源とする」設計であり、方向性は近い。差分として:

- OpenHarnessは`AllowedPath`のように「permissionの一部をteam単位で緩和する」明示的な仕組みを持つ（CreatorHubには現状ない概念）。
- OpenHarnessは`BackgroundTaskManager`との統合（[tools.md](tools.md)の completion listener 参照）で、サブエージェント完了を hook 経由で検知する仕組みが組み込み済み。CreatorHubのLoop完了検知（`90_Loop/logs/*.log`のexitcode）は現状ファイル監視ベースで、hookイベント駆動ではない。

## 未実読だが存在が確認できたファイル（今後深掘りする候補）

`swarm/mailbox.py`（`get_team_dir`をteam_lifecycle.pyがimport — team間メッセージング担当と推測）, `swarm/lockfile.py`, `swarm/permission_sync.py`, `swarm/worktree.py`（git worktree操作、`EnterWorktree`/`ExitWorktree`ツールと連動と推測）, `swarm/subprocess_backend.py`（agent_tool.pyが使う実行バックエンド本体）。
