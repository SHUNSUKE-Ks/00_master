# tools: 43+ツールの一覧と設計

対象ファイル（実読）: `src/openharness/tools/agent_tool.py`（141行）, `src/openharness/tools/base.py`（80行）
対象（README記載の一覧を引用・整理）

## カテゴリ別ツール一覧（README「Features」より）

| カテゴリ | ツール | 用途 |
|---|---|---|
| File I/O | Bash, Read, Write, Edit, Glob, Grep | 権限チェック付きの基本ファイル操作 |
| Search | WebFetch, WebSearch, ToolSearch, LSP | Web・コード検索 |
| Notebook | NotebookEdit | Jupyterノートブックのセル編集 |
| Agent | Agent, SendMessage, TeamCreate/Delete | サブエージェント生成と協調 |
| Task | TaskCreate/Get/List/Update/Stop/Output | バックグラウンドタスク管理 |
| MCP | MCPTool, ListMcpResources, ReadMcpResource | Model Context Protocol統合 |
| Mode | EnterPlanMode, ExitPlanMode, Worktree | ワークフローモード切替 |
| Schedule | CronCreate/List/Delete, RemoteTrigger | 定期実行・リモートトリガー |
| Meta | Skill, Config, Brief, Sleep, AskUser | 知識読込・設定・対話 |

**このセッション（Claude Code）で使えるツール名とほぼ1対1対応している**（Agent, AskUserQuestion, EnterPlanMode, ExitPlanMode, ToolSearch, CronCreate/List/Delete, RemoteTrigger, SendMessage, TaskCreate/Get/List/Update/Stop/Output, NotebookEdit, WebFetch, WebSearch, EnterWorktree/ExitWorktree等）。ファイル実体は `src/openharness/tools/` 配下に1ツール1ファイルで存在（40ファイル超）。

## AgentToolの実装から読み取れる設計（agent_tool.py実読）

`AgentTool`（name="agent"）がサブエージェント生成を担う。入力(`AgentToolInput`)は:
- `description`, `prompt` — 委任内容
- `subagent_type` — `general-purpose` / `Explore` / `worker`等のagent定義名（`coordinator/agent_definitions.py`から解決）
- `mode`: `local_agent` / `remote_agent` / `in_process_teammate` の3択
- `team` — 所属させるチーム名（省略時 `"default"`）

実行の流れ:
1. `subagent_type`があれば`get_agent_definition()`でモデル・システムプロンプト・permissionを解決
2. **常にsubprocessバックエンドを使う** — コメントに明記されている理由が実務的で重要: `in_process`タスクはasyncio内部IDを持ちtask系ツールから照会できないが、subprocessは`BackgroundTaskManager`に登録されどのプラットフォームでも動くため
3. `team`指定があれば`TeamRegistry`に登録（未作成なら`create_team`してから`add_agent`）
4. `hook_executor`があれば、エージェント完了時に`SUBAGENT_STOP`フックを発火するリスナーを`BackgroundTaskManager`に登録（完了検知後に自動でunregisterする一発リスナー）

この「hookのcompletionリスナーを一発物として登録→発火後に自身をunregisterする」パターンは、CreatorHubのLoop完了通知やTaskBoard連携を設計する際の参考になる。

## 共通契約（BaseTool）

`tools/base.py`を参照 → [cli_engine_core.md](cli_engine_core.md) に記載（Pydantic入力検証＋自己記述JSON Schema＋permission統合＋hook対応の4点セット）。

## ツール追加の型（README記載）

```python
from pydantic import BaseModel, Field
from openharness.tools.base import BaseTool, ToolExecutionContext, ToolResult

class MyToolInput(BaseModel):
    query: str = Field(description="Search query")

class MyTool(BaseTool):
    name = "my_tool"
    description = "Does something useful"
    input_model = MyToolInput

    async def execute(self, arguments: MyToolInput, context: ToolExecutionContext) -> ToolResult:
        return ToolResult(output=f"Result for: {arguments.query}")
```

## Webツールの安全設計

README「Web search and proxy settings」より: `web_search`（既定DuckDuckGo HTML検索、SearXNG差し替え可）と`web_fetch`は`trust_env=False`固定でSSRF対策済み。プロキシは`HTTP_PROXY`/`HTTPS_PROXY`を自動継承せず、専用の`OPENHARNESS_WEB_PROXY`でオプトインする必要がある（埋め込み認証情報付きURLは拒否）。この「envプロキシを自動継承しない」設計は、CreatorHubで外部WebFetch系ツールを使うagentのセキュリティ方針として踏襲を検討する価値がある。
