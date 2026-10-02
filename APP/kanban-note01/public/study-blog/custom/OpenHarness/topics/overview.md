# overview: OpenHarnessとは何か

対象: https://github.com/HKUDS/OpenHarness （README.md, CHANGELOG.md, docs/SHOWCASE.md を実読）

## 位置づけ

OpenHarnessは2部構成のPythonプロジェクト。

1. **`oh` (OpenHarness本体)** — Claude Code的な「エージェントハーネス」のオープンソース実装。CLIから起動し、LLM（Anthropic/OpenAI/Copilot/Codex/Moonshot等）にツール実行能力・スキル・permission・hooks・マルチエージェント調整を与える基盤。
2. **`ohmo` (個人エージェント)** — `oh`の上に乗る常駐アプリ。Feishu/Slack/Telegram/Discordのチャット越しに長時間セッションで動き、ブランチを切ってコードを書きテストを回しPRを開く、という「実際に働く」個人アシスタント。追加APIキー不要で、ユーザーが既に持っているClaude Code/Codexのサブスクリプションの上で動く。

READMEの結び「**The model is the agent. The code is the harness.**」がこのプロジェクトの一言要約。

## Harness Architecture（10サブシステム）

READMEが明示する構造（`src/openharness/` 配下）:

```
engine/          エージェントループ（query → stream → tool-call → loop）
tools/           43+のツール（file I/O, shell, search, web, MCP）
skills/          知識のオンデマンド読込（.mdファイル）
plugins/         拡張（commands, hooks, agents, MCPサーバー）
permissions/     安全機構（多段permission mode, パスルール, コマンド拒否）
hooks/           ライフサイクル（PreToolUse/PostToolUse）
commands/        54個のスラッシュコマンド（/help, /commit, /plan, /resume...）
mcp/             Model Context Protocolクライアント
memory/          永続的な横断セッション記憶
tasks/           バックグラウンドタスク管理
coordinator/     マルチエージェント（subagent spawning, team coordination）
prompts/         システムプロンプト組み立て、CLAUDE.md注入
config/          多層設定・マイグレーション
ui/              React TUI（backendプロトコル＋frontend）
```

エージェントループの核（README記載の擬似コード）:

```python
while True:
    response = await api.stream(messages, tools)
    if response.stop_reason != "tool_use":
        break
    for tool_call in response.tool_uses:
        result = await harness.execute_tool(tool_call)  # Permission → Hook → Execute → Hook
    messages.append(tool_results)
```

## Claude Codeとの近さ

`src/openharness/prompts/system_prompt.py` の `_BASE_SYSTEM_PROMPT` を実読すると、「Tone and style」「Doing tasks」「Executing actions with care」といった見出し構成・文言が、このセッションの実行基盤（Claude Code）のシステムプロンプトと非常に近い。ツール名も `tools/agent_tool.py`, `tools/ask_user_question_tool.py`, `tools/enter_plan_mode_tool.py`, `tools/tool_search_tool.py` など、このセッションで使っているツール群（Agent, AskUserQuestion, EnterPlanMode, ToolSearch）とほぼ1対1で対応する。つまりOpenHarnessは「Claude Codeの設計をPythonでオープンソース再実装したもの」と捉えるのが実態に近い。

## プロバイダ互換性

Anthropic-compatible / OpenAI-compatible の2系統のAPI形式を軸に、Claude公式・Moonshot(Kimi)・GLM・MiniMax・OpenAI・OpenRouter・DashScope・DeepSeek・GitHub Models・SiliconFlow・NVIDIA NIM・Gemini・Groq・Ollama(ローカル)・GitHub Copilot(OAuth device flow)まで対応（詳細は[provider_auth.md](provider_auth.md)）。

## テスト規模

114 unit/integration + E2E各種（CLI Flags 6, Harness Features 9, React TUI 3, TUI Interactions 4, Real Skills+Plugins 12）。`anthropics/skills` と `anthropics/claude-code` の公式pluginsと実際に互換性テストをしている点が特徴（Claude Codeエコシステムへの意図的な追従）。

## 関連ファイル

- README.md（英語）/ README.zh-CN.md（中国語）
- CHANGELOG.md, RELEASE_NOTES_v0.1.8.md, RELEASE_NOTES_v0.1.9.md — v0.1.0(2026-04-01初回OSS公開)からv0.1.9まで急速に機能追加が続いている
- docs/SHOWCASE.md — 実例（repo coding assistant, headless scripting, plugin/skillテストベッド、マルチエージェント試作、プロバイダ比較サンドボックス）
- LICENSE（MIT）
