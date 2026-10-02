# hooks_permissions_sandbox: ライフサイクルフックと安全機構

対象ファイル（実読）:
- `src/openharness/hooks/executor.py`（先頭90行、242行中）
- `src/openharness/permissions/checker.py`（先頭90行、200行中）
- `src/openharness/sandbox/adapter.py`（先頭60行、148行中）

## Hooks — PreToolUse/PostToolUse以外も含むイベント駆動

`HookExecutor.execute(event, payload)`が`HookRegistry`から該当イベントのhookを引き、種類別に実行を振り分ける:

- `CommandHookDefinition` → シェルサブプロセスを起動（`_run_command_hook`。`shlex`で引数をエスケープしてから注入）
- `HttpHookDefinition` → `httpx`でHTTP呼び出し
- `PromptHookDefinition` / `AgentHookDefinition` → `_run_prompt_like_hook`にagent_mode真偽を渡して分岐（モデルへのプロンプト注入 or サブエージェント起動）

`HookEvent`列挙は`tools/agent_tool.py`の実読からも`SUBAGENT_STOP`が存在すると確認できる（サブエージェント完了通知）。`USER_PROMPT_SUBMIT`は`engine/query_engine.py`の`submit_message`実読で確認済み。つまり最低でも user prompt submit / pre-post tool use / subagent stop の系統のイベントが揃っている。

**hookの実行がサンドボックス未使用可能エラー(`SandboxUnavailableError`)をimportしている**（executor.py:28）＝ hookのコマンド実行自体もsandbox制約の対象になり得る設計。

## Permissions — 多段permission mode ＋ハードコードされた機密パス保護

`PermissionChecker`（permissions/checker.py）の要点:

- **`SENSITIVE_PATH_PATTERNS`は permission modeやユーザー設定に関わらず常に拒否**（checker.py:14-37のコメントに明記）。対象: `~/.ssh/*`, `~/.aws/credentials`, `~/.aws/config`, `~/.config/gcloud/*`, `~/.azure/*`, `~/.gnupg/*`, `~/.docker/config.json`, `~/.kube/config`, さらに`~/.openharness/credentials.json`, `~/.openharness/copilot_auth.json`（自分自身の認証情報も対象に含めている）。
- 目的はコメントに明記：「LLM主導のアクセスやプロンプトインジェクション経由での機密ファイル閲覧を多層防御(defence-in-depth)する」。
- `PathRule(pattern, allow)` — fnmatchベースのグロブルールで、settings.json側で`path_rules`として追加設定可能（README例: `{"pattern": "/etc/*", "allow": false}`）。
- `PermissionDecision(allowed, requires_confirmation, reason)` が評価結果。

README記載のpermission mode 3種:

| Mode | 挙動 | 用途 |
|---|---|---|
| Default | 書込/実行前に確認 | 日常開発 |
| Auto | 全許可 | サンドボックス環境 |
| Plan Mode | 全書込をブロック | 大規模リファクタ・レビュー先行 |

## Sandbox — 外部`srt` (sandbox-runtime) CLIのアダプタ

`sandbox/adapter.py`実読より、OpenHarness自体はサンドボックスを内製せず、`srt`という外部CLIをラップする設計（`SandboxUnavailableError`, `SandboxAvailability(enabled, available, reason, command)`）。

- `build_sandbox_runtime_config(settings)`が設定を`srt`向けペイロードに変換: `network.allowedDomains/deniedDomains`、`filesystem.allowRead/denyRead/allowWrite/denyWrite`。
- `get_sandbox_availability()`はまず`settings.sandbox.enabled`を見て、次に`get_platform_capabilities(platform_name).supports_sandbox_runtime`でプラットフォーム対応可否を判定（全プラットフォームでサンドボックスが使えるわけではないことを前提にした設計）。
- `sandbox/docker_backend.py`, `sandbox/Dockerfile`も存在 — Dockerベースの代替/補完バックエンドがある（未実読）。

## CreatorHubへの示唆

- 「機密パス保護はpermission modeより上位の不可侵レイヤーとしてハードコードする」という設計は、CreatorHubのagentが将来Bashやファイル操作を自動化する範囲を広げる際の安全網として直接参考にできる。
- hookのcommand実行で`shlex`エスケープを徹底している点は、CreatorHubのLoop/runbookでコマンド文字列をagentに組み立てさせる設計（`90_Loop/run_agent.ps1`等）のインジェクション対策の参考になる。
