# cli_engine_core: CLIとエージェントループの核

対象ファイル（実読）:
- `src/openharness/engine/query_engine.py`（306行）
- `src/openharness/tools/base.py`（80行）
- `src/openharness/prompts/system_prompt.py`（109行）
- `src/openharness/config/schema.py`（119行、参考）

## QueryEngine — 会話履歴とツールループの所有者

`QueryEngine`クラス(`engine/query_engine.py`)が中心。責務は「会話履歴(`_messages`)を持ち、ユーザー入力ごとに`run_query`(engine/query.py、未実読)へ委譲してツール呼び出しループを回す」こと。

主要メソッド:
- `submit_message(prompt)` — ユーザーメッセージを追加し、`QueryContext`を組み立てて`run_query`をストリーミング実行。終了後に必ず `_update_session_memory()` / `_extract_durable_memories()` / `_schedule_auto_dream()` を呼ぶ（`finally`節）。
- `continue_pending(max_turns=...)` — 直前のツール実行結果待ちで中断した会話を、新規ユーザー入力なしで再開する。
- `has_pending_continuation()` — 直近メッセージがtool_resultで終わっていて、かつ直前のassistantメッセージにtool_usesがあるかを見て「継続すべき状態か」を判定。

設計上の要点:
- **fire-and-forgetのメモリ処理**が`submit_message`の`finally`に集約されている＝ユーザー応答をブロックしない設計。
- `CostTracker`でターンごとのusageを積算（`total_usage`プロパティ）。
- `set_model` / `set_effort` / `set_api_client` / `set_permission_checker` などsetterが充実 — 実行中にプロバイダやpermission modeを切り替え可能な設計（`oh provider use`等のランタイム切替に対応）。

## ToolRegistry / BaseTool — 全ツール共通の型

`tools/base.py`にある型がこの実装の一番小さいが重要な部分:

```python
class BaseTool(ABC):
    name: str
    description: str
    input_model: type[BaseModel]           # Pydanticモデルで入力を型付け

    @abstractmethod
    async def execute(self, arguments, context) -> ToolResult: ...

    def is_read_only(self, arguments) -> bool:  # 既定False
        ...

    def to_api_schema(self) -> dict:  # Anthropic Messages API形式のtool schemaを自動生成
        ...
```

- `ToolExecutionContext(cwd, metadata, hook_executor)` — 全ツール実行に共通で渡る文脈。`metadata`は`dict[str, Any]`で、agentツールなどが状態を持ち越すのに使う自由枠。
- `ToolRegistry` は name→BaseTool の単純な辞書ラッパー。`to_api_schema()`で全ツールのJSON Schemaを一括生成しモデルに渡す。
- **Pydantic入力検証＋自己記述スキーマ**という組み合わせが全43ツール共通。ツールを追加する際のテンプレートがREADMEにも載っている(`MyToolInput(BaseModel)` → `MyTool(BaseTool)`)。

## システムプロンプト組み立て

`prompts/system_prompt.py`の`_BASE_SYSTEM_PROMPT`は固定文字列で、`build_system_prompt()`が末尾に環境情報セクション（OS/Shell/cwd/date/Python/git branch等）を追記するだけの単純な構成。カスタムプロンプトで丸ごと差し替え可能（`custom_prompt`引数）。

このシステムプロンプトの見出し構成（System / Doing tasks / Executing actions with care / Using your tools / Tone and style）は、このセッション自身の system prompt と概念的に一致する。CreatorHubのagent定義（`.claude/agents/*.md`）を書くときの見出しの型として参考になる。

## CLIの形

READMEより:
```
oh [OPTIONS] COMMAND [ARGS]
Session:     -c/--continue, -r/--resume, -n/--name
Model:       -m/--model, --effort, --max-turns
Output:      -p/--print, --output-format text|json|stream-json
Permissions: --permission-mode, --dangerously-skip-permissions
Advanced:    -d/--debug, --mcp-config, --bare
Subcommands: oh setup | oh provider | oh auth | oh mcp | oh plugin
```

`--dry-run`はモデル呼び出し・ツール実行・MCP接続を一切せずに「この設定でどう動くか」だけを静的にプレビューする機能（ready/warning/blockedの判定＋next actions提示）。CreatorHubのagent発火前チェック（例えばTaskBoard検査コマンド）に似た思想。
