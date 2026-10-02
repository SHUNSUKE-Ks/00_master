# provider_auth: プロバイダ切替と認証

対象ファイル（実読）:
- `src/openharness/api/provider.py`（先頭70行、186行中）
- README「Provider Compatibility」節

## プロバイダを「ワークフロー」として扱う設計

READMEの表現通り、OpenHarnessはプロバイダを「named profileが後ろに控えたworkflow」として扱う。生のprovider/auth内部を露出させず`oh setup`のようなウィザードで抽象化している（v0.1.2で導入、"setup guides provider selection as workflows instead of exposing raw auth/provider internals"）。

### 組み込みワークフロー5種

| Workflow | 実体 | 認証方式(`_AUTH_KIND`, provider.py:13-19) |
|---|---|---|
| Anthropic-Compatible API | Claude公式/Kimi/GLM/MiniMax等 | `api_key` |
| Claude Subscription | ローカル`~/.claude/.credentials.json`をブリッジ | `external_oauth` |
| OpenAI-Compatible API | OpenAI公式/OpenRouter/DashScope/DeepSeek/Groq/Ollama等 | `api_key` |
| Codex Subscription | ローカル`~/.codex/auth.json`をブリッジ | `external_oauth` |
| GitHub Copilot | OAuth device flow | `oauth_device` |

`detect_provider(settings)`（provider.py実読）が`settings.provider`と`settings.api_format`から`ProviderInfo(name, auth_kind, voice_supported, voice_reason)`を解決する。voice機能は現状Copilot/Codex/Claude subscriptionでは非対応（`_VOICE_REASON`辞書に理由文言あり）。

### OpenAI-Compatible APIの対応バックエンド一覧（README表）

OpenAI公式, OpenRouter, Alibaba DashScope(qwen3.5/deepseek-r1), DeepSeek, GitHub Models, SiliconFlow, NVIDIA NIM, Google Gemini, Groq, Ollama(ローカル)。

### プロファイル管理コマンド

```bash
oh provider list
oh provider use <profile>
oh provider add my-endpoint --label "My Endpoint" --provider openai \
  --api-format openai --auth-source openai_api_key --model my-model --base-url https://example.com/v1
```

カスタムエンドポイントごとに個別の認証情報をバインドできる（Anthropic互換/OpenAI互換の全バックエンドが同一APIキーを共有する必要がない）。

### GitHub Copilotフォーマット

`--api-format copilot`。GitHub OAuth device flow（APIキー不要）。`oh auth copilot-login` / `oh auth status` / `oh auth copilot-logout`。内部的にはOpenAI互換chat completionsとして扱われる。Enterprise対応（`--github-domain`）。

## ohmoは既存サブスクリプションに乗る

README「ohmo runs on your existing Claude Code or Codex subscription — no extra API key needed」。つまり`ohmo`個人エージェントは、ユーザーが既に持っているClaude Code/Codexの認証情報をそのまま使い回す設計 — 個人開発者が複数チャネルに常駐エージェントを持ちたい場合の追加コストを抑える設計判断。

## CreatorHubへの示唆

ユーザーが「今週はCODEXで運用するかもしれない」と言っている状況と直接関係が深いtopic。OpenHarnessの「Claude Code/Codexサブスクリプションを外部ブリッジとして使う」実装（`external_oauth`）は、ClaudeとCodexを併用運用する際の認証設計の参考事例になる。
