# OpenHarness Key Dict Sample

このファイルは一回限りのSampleテスト用。
`OpenHarness` 原本を直接変更せず、Note側に複製した資料へ検索しやすいKeyを付ける。

## 大分類

| category | scope | 説明 |
| --- | --- | --- |
| 自分用 | Note_Story / Study | 自分の制作技術書、学習カード、再利用パターン |
| Claude用 | Claude RPA資料 | Claude側から届いたRPA・OSS解析資料 |
| custom用 | custom | 実験用の辞書、変換規則、手作業メモ |

## 自分用

```txt
MD_教材: 自分が後で読む技術記事として整える文書
UI_閲覧: Android PWAで読みやすく表示する画面
DB_分類: Study資料を大分類、Book、Cardへ分ける保存構造
RG_索引: AIが資料へ到達しやすくする目次
LP_改稿: 読みにくい記事を後から直す反復処理
```

## Claude用

```txt
HN_実行: Harnessがツールやコマンドを動かす処理
HN_検証: Harnessが成果物や実行結果を確認する処理
HN_権限: permission、sandbox、承認ゲートを扱う領域
AG_委任: agentへ作業を渡して実行させる処理
AG_協働: 複数agentが分担して結果を返す構造
OR_統括: team、swarm、autopilotを管理する上位制御
LP_自走: 改善候補を検出し、承認後に処理を進めるループ
RG_参照: topicsやmanualから必要箇所を読む行為
```

## custom用

```txt
MD_規則: prompt_dict_ruleとしてKey命名を固定する文書
MD_目次: manual、topics、customをつなぐ入口
DB_写本: 原本を壊さずNote側へ複製した資料
DB_原本: 変更しない参照元フォルダー
RG_変換: 元資料をRAG向けの短いKeyへ置き換える処理
UI_切替: Study内で自分用、Claude用、custom用を切り替える表示
```

## Topic対応

| file | Key | 用途 |
| --- | --- | --- |
| `manual.md` | MD_導入 | OpenHarness資料の読み方 |
| `目次.md` | RG_索引 | topicへ移動する入口 |
| `topics/overview.md` | HN_全体 | OpenHarnessの構成を把握する |
| `topics/cli_engine_core.md` | AG_対話 | QueryEngineと会話ループ |
| `topics/tools.md` | HN_道具 | ToolRegistryとtool設計 |
| `topics/skills_plugins.md` | AG_技能 | SkillとPluginの読込 |
| `topics/hooks_permissions_sandbox.md` | HN_権限 | Hook、権限、sandbox |
| `topics/memory.md` | RG_記憶 | memoryと重複排除 |
| `topics/swarm_multi_agent.md` | OR_分担 | multi-agentとteam |
| `topics/mcp.md` | HN_接続 | MCP clientとtransport |
| `topics/provider_auth.md` | HN_認証 | providerとauth |
| `topics/channels_gateway.md` | OR_通路 | channel bridgeとgateway |
| `topics/autopilot.md` | LP_自走 | repo autopilot |
| `topics/ui_cron.md` | UI_定期 | TUIとcron |
```
