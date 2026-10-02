# OpenHarness 概念Key読解

対象本文: `topics/overview.md`

この記事は、OpenHarnessの記事本文を消さずに複製し、段落の前に **漢字2〜4文字の概念Key** を差し込んだ読解版。
`AG_` や `HN_` のような英語Prefixは、この記事本文の読解Keyでは使わない。

## 読解ルール

形式（Format）: 説明したい本文の直前に、漢字2〜4文字のKeyを置く。

```txt
概念Key: ここから下の本文を読むための視点
本文本文本文...
```

保持（Keep）: 元記事の本文を消さない。

補助（Guide）: Keyは本文の代わりではなく、本文を読むための見出し・索引・意味ラベルとして使う。

追加（Add）: 読んでいて必要になったKeyは増やしてよい。

---

# overview: OpenHarnessとは何か

対象: https://github.com/HKUDS/OpenHarness （README.md, CHANGELOG.md, docs/SHOWCASE.md を実読）

## 位置づけ

位置（Position）: この段落は、OpenHarnessが何のためのプロジェクトかを説明している。

OpenHarnessは2部構成のPythonプロジェクト。

二層（Two Layer）: `oh` と `ohmo` の役割分担を見る。前者がHarness本体、後者が常駐する個人Agent。

1. **`oh` (OpenHarness本体)** — Claude Code的な「エージェントハーネス」のオープンソース実装。CLIから起動し、LLM（Anthropic/OpenAI/Copilot/Codex/Moonshot等）にツール実行能力・スキル・permission・hooks・マルチエージェント調整を与える基盤。
2. **`ohmo` (個人エージェント)** — `oh`の上に乗る常駐アプリ。Feishu/Slack/Telegram/Discordのチャット越しに長時間セッションで動き、ブランチを切ってコードを書きテストを回しPRを開く、という「実際に働く」個人アシスタント。追加APIキー不要で、ユーザーが既に持っているClaude Code/Codexのサブスクリプションの上で動く。

要約（Summary）: モデルがAgentで、コードがHarnessである、という責任分離を一言で示している。

READMEの結び「**The model is the agent. The code is the harness.**」がこのプロジェクトの一言要約。

## Harness Architecture（10サブシステム）

構造（Structure）: ここはOpenHarnessを部品ごとに読むための索引。RAGやStudyではこの一覧が入口になる。

READMEが明示する構造（`src/openharness/` 配下）:

```txt
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

循環（Loop）: ここはAgent Harnessの核。LLMがtool_useを返したら、Harnessが実行し、結果をmessagesへ戻す。

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

安全（Safety）: `execute_tool` の中で Permission → Hook → Execute → Hook が挟まる点を見る。単なる実行ではなく、確認と記録を含む。

## Claude Codeとの近さ

比較（Compare）: この段落は、OpenHarnessをClaude CodeやCodexの開発体験と見比べるための根拠。

`src/openharness/prompts/system_prompt.py` の `_BASE_SYSTEM_PROMPT` を実読すると、「Tone and style」「Doing tasks」「Executing actions with care」といった見出し構成・文言が、このセッションの実行基盤（Claude Code）のシステムプロンプトと非常に近い。ツール名も `tools/agent_tool.py`, `tools/ask_user_question_tool.py`, `tools/enter_plan_mode_tool.py`, `tools/tool_search_tool.py` など、このセッションで使っているツール群（Agent, AskUserQuestion, EnterPlanMode, ToolSearch）とほぼ1対1で対応する。つまりOpenHarnessは「Claude Codeの設計をPythonでオープンソース再実装したもの」と捉えるのが実態に近い。

近似（Similarity）: 「似ている」で終わらせず、prompt構成、tool名、plan mode、tool searchなど、対応する部品を照合して読む。

## プロバイダ互換性

接続（Connection）: この段落は、OpenHarnessがどのLLMプロバイダへ接続できるかを示している。

Anthropic-compatible / OpenAI-compatible の2系統のAPI形式を軸に、Claude公式・Moonshot(Kimi)・GLM・MiniMax・OpenAI・OpenRouter・DashScope・DeepSeek・GitHub Models・SiliconFlow・NVIDIA NIM・Gemini・Groq・Ollama(ローカル)・GitHub Copilot(OAuth device flow)まで対応（詳細は[provider_auth.md](provider_auth.md)）。

互換（Compatibility）: API形式を寄せることで、複数モデルをHarness側から切り替えやすくしている。

## テスト規模

検証（Verification）: ここはOpenHarnessの信頼性を見るための段落。テストの数と、Claude Code ecosystemとの互換テストに注目する。

114 unit/integration + E2E各種（CLI Flags 6, Harness Features 9, React TUI 3, TUI Interactions 4, Real Skills+Plugins 12）。`anthropics/skills` と `anthropics/claude-code` の公式pluginsと実際に互換性テストをしている点が特徴（Claude Codeエコシステムへの意図的な追従）。

追従（Follow）: 公式pluginsとの互換性をテストしているため、独自実装でありながらClaude Code文化圏へ寄せていると読める。

## 関連ファイル

索引（Index）: ここは次に読む資料への導線。Studyではこの一覧をCardやRelationへ変換しやすい。

- README.md（英語）/ README.zh-CN.md（中国語）
- CHANGELOG.md, RELEASE_NOTES_v0.1.8.md, RELEASE_NOTES_v0.1.9.md — v0.1.0(2026-04-01初回OSS公開)からv0.1.9まで急速に機能追加が続いている
- docs/SHOWCASE.md — 実例（repo coding assistant, headless scripting, plugin/skillテストベッド、マルチエージェント試作、プロバイダ比較サンドボックス）
- LICENSE（MIT）

## この読解で使った概念Key

```txt
位置（Position）: 記事やプロジェクトの立ち位置を読む
二層（Two Layer）: 本体と応用など、二つの層で構成を見る
要約（Summary）: 長い説明を一言の意味へ圧縮する
構造（Structure）: サブシステムや部品の並びを見る
循環（Loop）: LLM応答、tool実行、結果追記の反復を見る
安全（Safety）: 実行前後の確認、権限、Hookを見る
比較（Compare）: 既存ツールや自分の環境と見比べる
近似（Similarity）: 設計や部品が似ている点を確認する
接続（Connection）: 外部プロバイダやプロトコルとのつながりを見る
互換（Compatibility）: 複数環境で差し替え可能かを見る
検証（Verification）: テストや確認方法を見る
追従（Follow）: 既存エコシステムへ合わせている点を見る
索引（Index）: 次に読むファイルやRelationを見る
```
