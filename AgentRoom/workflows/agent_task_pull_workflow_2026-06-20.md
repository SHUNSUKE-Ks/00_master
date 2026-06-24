# Agent Task Pull Workflow

meta:
  date: 2026-06-20
  owner: codex
  status: testing
  purpose: 各アプリAgentがKanbanのTaskTicketを見て、自分の担当作業を把握して開始する

## summary

常駐Agentではなく、まず手動コマンドでTaskTicketをPullする。

各アプリAgentは `AgentRoom/configs/agents.json` に担当project、見るtag、触ってよいpath、触ってはいけないpathを持つ。

## command

CreatorGameLab Agent:

```powershell
cd C:\00_master
node AgentRoom\commands\agent-task-pull.mjs --agent creator_game_lab_agent
```

## workflow

1. `agents.json` からAgent設定を読む。
2. `DevApps\kanban_June\src\data\sampleDb.ts` のTaskTicketを読む。
3. Agentの担当 `projectIds` に合う未完了TaskTicketを抽出する。
4. `doNotTouchPaths` に触れるTaskは、開始候補ではなく引継ぎ候補へ分ける。
5. `doing`、`ready`、`agent_pull_ready` を優先する。
6. 選定したTaskTicketのStart Promptを出す。
7. `AgentRoom\reports` にPull結果を保存する。
8. AgentまたはCodexはStart Promptに従って作業する。

## add another app agent

1. `AgentRoom\configs\agents.json` にAgentを追加する。
2. `projectIds` と `ownedPaths` を決める。
3. `doNotTouchPaths` を決める。
4. profile / taskWatch / reporting資料を作る。
5. 次のコマンドでPullする。

```powershell
cd C:\00_master
node AgentRoom\commands\agent-task-pull.mjs --agent <agent_id>
```

## limitation

- 現状は `sampleDb.ts` のseedを読む。
- ブラウザlocalStorage内のKanban状態は直接読まない。
- 自動で`doing`へ移動しない。Start Promptを出すところまで。
- 本格同期する場合は、Kanban側にJSON exportまたはNode scan APIが必要。

## first result

CreatorGameLab Agentで試行した結果:

- 開始候補: 4件
- 引継ぎ候補: 2件
- 選定: `TT-20260619-010-novel-engine-deliverables`

`APP\novelEngine` 本体を触るTaskは、CreatorGameLab Agentの `doNotTouchPaths` に当たるため引継ぎ扱いにした。
