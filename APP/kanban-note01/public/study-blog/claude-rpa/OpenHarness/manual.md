# OpenHarnessライブラリ 利用マニュアル

最終更新: 2026-07-08
対象リポジトリ: https://github.com/HKUDS/OpenHarness （デフォルトブランチ main、解析時点で480ファイル、MITライセンス、star 14,637）

## これは何のフォルダーか

OpenHarnessという実在OSS（"Open Agent Harness with a Built-in Personal Agent--Ohmo!"）を解析し、他のAI（Claude Code / Codex 等どのツールで運用していても読める形）が参照できるように再構成したナレッジベースです。

C:\00_claudemaster は複数のハーネスエンジニアリング・プロジェクトを横断管理する司令塔ワークスペースで、01_Library/01_Library はその中でmd/json資料をRAG的に管理するObsidian Vaultルートです（詳細は [C:\00_claudemaster\CLAUDE.md](../../../CLAUDE.md)）。このOpenHarnessフォルダーは「外部GitHubリポジトリを解析してライブラリ化する」ことの最初のサンプルであり、今後同種の解析（別リポジトリ）を行うときのフォーマットの型になります。

OpenHarness自体はこのワークスペースの実装物ではありません。**読み物・参考実装**として置いてあります。CreatorHub（`00_Projects/CreatorHub/`）のagent/harness設計時に、「他の実装ではどう解決しているか」を調べる先として使ってください。

## なぜOpenHarnessを読む価値があるか

OpenHarnessはClaude Code（このセッションを動かしているツールそのもの）と非常に近い設計思想のPython実装です。README冒頭にも `The model is the agent. The code is the harness.` とある通り、ツール群・スキル機構・hooks・permission・マルチエージェント(swarm)・MCP統合など、Claude Codeのアーキテクチャをオープンソースで再現しつつ、Feishu/Slack/Telegram/Discordなどのチャットプラットフォームに常駐する個人エージェント「ohmo」を上乗せしています。つまり「Claude Code的なハーネスを自分のチャットアプリに常駐させたい」というCreatorHubの一部の構想（例えば`00_Projects/CreatorHub`のOrchestra/Loop）と直接比較できる実装例です。

## フォルダー構成

```
OpenHarness/
├── manual.md      ← このファイル
├── 目次.md         ← 索引（各topicへのリンクと一行要約）
└── topics/        ← サブシステム別の解説ファイル（12本）
    ├── overview.md                    全体像・Ohmoとの関係・アーキテクチャ図
    ├── cli_engine_core.md             CLI / QueryEngine / エージェントループ
    ├── tools.md                       43+ツールの一覧と設計思想
    ├── skills_plugins.md              skill機構（SKILL.md）＋plugin機構
    ├── hooks_permissions_sandbox.md   hooks / permissions / sandbox（srt・docker）
    ├── memory.md                      永続メモリ機構（MEMORY.md＋個別ファイル）
    ├── swarm_multi_agent.md           マルチエージェント・team・swarmバックエンド
    ├── mcp.md                         MCPクライアント統合
    ├── provider_auth.md               プロバイダ切替と認証（Claude/Codexサブスクリプション橋渡し）
    ├── channels_gateway.md            外部チャネル統合＋ohmoゲートウェイ
    ├── autopilot.md                   リポジトリ自走サービス（Repo Autopilot）
    └── ui_cron.md                     TUI（React/Ink）・Cron定期実行
```

## 読み方（他のAI向け）

1. まず `topics/overview.md` で全体像とOhmoとの関係を把握する。
2. 目的別に該当topicへ飛ぶ。例:
   - 「CreatorHubのagent委任(Agent tool)の設計を見直したい」→ `topics/swarm_multi_agent.md`
   - 「skillの読み込み優先順位を知りたい」→ `topics/skills_plugins.md`
   - 「permission/sandboxの安全設計を比較したい」→ `topics/hooks_permissions_sandbox.md`
   - 「Slack/Discord等への常駐エージェント化を検討したい」→ `topics/channels_gateway.md`
   - 「メモリの索引/本文分離や重複排除の設計を参考にしたい」→ `topics/memory.md`
   - 「AIが自発的に見つけた改善提案を人間承認ゲート付きで自動運転させる設計を見たい」→ `topics/autopilot.md`
   - 「ClaudeとCodexを併用運用したい」→ `topics/provider_auth.md`
3. 各topicファイルには実際に読んだソースファイルのパス（`src/openharness/...`）を明記してある。裏取りが必要な場合は `https://raw.githubusercontent.com/HKUDS/OpenHarness/main/<path>` で本文を取得できる（このマシンには`gh` CLIが無いため、`curl`でGitHub API / raw.githubusercontent.comを使うこと）。
4. **全480ファイルを読んだわけではない**。各topicは代表ファイル数本の実読＋READMEの記述をもとにした要約。詳細な実装が必要な場面では、そのtopicに書かれたパスから実ファイルを都度取得して読むこと。読めなかった/推測に留まった箇所は各topic内で「未実読」「推測」と明記してある。

## 運用上の注意

- ここはOpenHarness側の更新を追随する場所ではない（一時点でのスナップショック解析）。バージョンが進んで構造が変わった場合は再解析が必要。
- READMEという名前のファイルは意図的に置いていない（ユーザー指示: マニュアルとして作成し、READMEにはしない）。
- 今後、他のGitHubリポジトリを同様に解析するときは、この `manual.md` / `目次.md` / `topics/` の3点構成をテンプレートとして踏襲する。
