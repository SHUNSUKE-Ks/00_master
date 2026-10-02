# OpenHarness 参照目次

Claude RPA資料として届いた `OpenHarness` を、Note内のStudyで読むための入口。
原本は変更せず、ここでは参照先、用途、読む順番だけを固定する。

## 大分類

| 区分 | 意味 |
| --- | --- |
| 自分の制作技術書 | Note_Storyを作る過程から、SolidJS、状態駆動、UI分割、PWA、Firebaseを学ぶ |
| Claude RPA資料 | Claude側から届いたRPA・外部OSS解析資料を、別カテゴリの参考資料として読む |

## Book

| key | value |
| --- | --- |
| Title | OpenHarness |
| GitHub | https://github.com/HKUDS/OpenHarness |
| Local原本 | `C:\00_claudemaster\01_Library\01_Library\OpenHarness` |
| Note側複製 | `C:\00_master\APP\kanban-note01\public\study-blog\custom\OpenHarness` |
| Note側扱い | 参照索引。原本は編集しない |

## 読む順番

1. `manual.md`
2. `目次.md`
3. `topics/overview.md`
4. 必要なtopicへ移動

## Topics

| file | 用途 |
| --- | --- |
| `topics/overview.md` | 全体像、Ohmo、10サブシステム構成 |
| `topics/cli_engine_core.md` | CLI、QueryEngine、エージェントループ |
| `topics/tools.md` | tool一覧、ToolRegistry、追加方法 |
| `topics/skills_plugins.md` | SKILL.md、plugin、読み込み優先順位 |
| `topics/hooks_permissions_sandbox.md` | hook、permission、sandbox |
| `topics/memory.md` | session memory、durable memory、抽出 |
| `topics/swarm_multi_agent.md` | multi-agent、team、spawn |
| `topics/mcp.md` | MCP client、transport、接続状態 |
| `topics/provider_auth.md` | provider、auth、Claude/Codex bridge |
| `topics/channels_gateway.md` | Slack/Discord等のchannel gateway |
| `topics/autopilot.md` | repo autopilot、人間承認ゲート |
| `topics/ui_cron.md` | TUI、cron、定期実行 |

## 取り込み規則

```json
{
  "sourceCategory": "Claude RPA資料",
  "bookTitle": "OpenHarness",
  "sourceUrl": "https://github.com/HKUDS/OpenHarness",
  "sourceLocalPath": "C:\\00_claudemaster\\01_Library\\01_Library\\OpenHarness",
  "notePolicy": "原本は変更せず、Note側には索引・要約・実験メモだけを置く"
}
```

## 次にやること

- `manual.md` と `目次.md` の本文を、RPA Material Pack形式へ変換する。
- topicごとに `memo` か `blog` を選び、Note内のStudyから読めるようにする。
- 自分の制作技術書とはタグと大分類を分ける。

## Sample Key Dict

- `custom/prompt_dict_rule.md`: Key命名規則
- `custom/openharness_key_dict.md`: OpenHarness用の自分用 / Claude用 / custom用分類
