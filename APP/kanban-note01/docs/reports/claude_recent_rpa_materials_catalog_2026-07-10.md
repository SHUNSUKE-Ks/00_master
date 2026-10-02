# Claude 最近作成RPA資料 目録レポート

meta:
  date: 2026-07-10
  source_app: kanban-note01 / Note_Story
  target: Claude / RPA / 00_InBox
  purpose: Claudeが最近作成・連携したRPA資料を、Note内Studyとローカルファイルの両方からたどれるようにする
  note_study_root: `C:\00_master\APP\kanban-note01\public\study-blog`
  study_card_registry: `C:\00_master\APP\kanban-note01\src\dataBridge\studyLibrary.ts`

## 00_読む順番

Claude側で確認する順番:

1. `01_Study表示目録`
2. `02_ClaudeRPAノートブック目録`
3. `03_Generated RPA資料`
4. `04_AgentRoom Designer Notebook`
5. `05_次アクション`

---

## 01_Study表示目録

Noteアプリ内では、左上メニューから `Study` を開き、`ClaudeRPA` を選ぶ。
Library表示で以下のBook / Cardが読める。

### ClaudeRPA / OpenHarness

| Card | Study file |
|---|---|
| OpenHarness / 目次 | `/study-blog/claude-rpa/OpenHarness/目次.md` |
| OpenHarness / manual | `/study-blog/claude-rpa/OpenHarness/manual.md` |
| OpenHarness / overview | `/study-blog/claude-rpa/OpenHarness/topics/overview.md` |

### ClaudeRPA / awesome-harness-engineering

| Card | Study file |
|---|---|
| awesome-harness-engineering / 目次 | `/study-blog/claude-rpa/awesome-harness-engineering/目次.md` |
| awesome-harness-engineering / manual | `/study-blog/claude-rpa/awesome-harness-engineering/manual.md` |
| awesome-harness-engineering / overview | `/study-blog/claude-rpa/awesome-harness-engineering/topics/overview.md` |

### ClaudeRPA / agent-skills-for-context-engineering

| Card | Study file |
|---|---|
| agent-skills-for-context-engineering / 目次 | `/study-blog/claude-rpa/agent-skills-for-context-engineering/目次.md` |
| agent-skills-for-context-engineering / manual | `/study-blog/claude-rpa/agent-skills-for-context-engineering/manual.md` |
| agent-skills-for-context-engineering / overview | `/study-blog/claude-rpa/agent-skills-for-context-engineering/topics/overview.md` |

### ClaudeRPA / second-brain-starter

| Card | Study file |
|---|---|
| second-brain-starter / 目次 | `/study-blog/claude-rpa/second-brain-starter/目次.md` |
| second-brain-starter / manual | `/study-blog/claude-rpa/second-brain-starter/manual.md` |
| second-brain-starter / overview | `/study-blog/claude-rpa/second-brain-starter/topics/overview.md` |

### ClaudeRPA / MultiAgent

| Card | Study file |
|---|---|
| MultiAgent / ai-orchestrator / 目次 | `/study-blog/claude-rpa/MultiAgent/目次.md` |
| MultiAgent / ai-orchestrator / manual | `/study-blog/claude-rpa/MultiAgent/manual.md` |
| MultiAgent / overview | `/study-blog/claude-rpa/MultiAgent/topics/overview.md` |
| MultiAgent / CreatorHub対応表 | `/study-blog/claude-rpa/MultiAgent/topics/concept-map.md` |
| MultiAgent / Agent Roles | `/study-blog/claude-rpa/MultiAgent/topics/agent-roles.md` |
| MultiAgent / Queue State Workflow | `/study-blog/claude-rpa/MultiAgent/topics/queue-state-workflow.md` |
| MultiAgent / Git Worktree | `/study-blog/claude-rpa/MultiAgent/topics/git-worktree.md` |
| MultiAgent / Rust Tauri SolidJS | `/study-blog/claude-rpa/MultiAgent/topics/rust-tauri-solidjs.md` |
| MultiAgent / Knowledge Factory | `/study-blog/claude-rpa/MultiAgent/topics/knowledge-factory.md` |
| MultiAgent / Implementation Roadmap | `/study-blog/claude-rpa/MultiAgent/topics/implementation-roadmap.md` |

### ClaudeRPA / DesignSystem

| Card | Study file |
|---|---|
| DesignSystem / SolidJS UI技術選定 / 目次 | `/study-blog/claude-rpa/DesignSystem/目次.md` |
| DesignSystem / SolidJS UI技術選定 / manual | `/study-blog/claude-rpa/DesignSystem/manual.md` |
| DesignSystem / 推奨構成 | `/study-blog/claude-rpa/DesignSystem/topics/overview.md` |
| DesignSystem / 技術役割Map | `/study-blog/claude-rpa/DesignSystem/topics/tech-role-map.md` |
| DesignSystem / Ark UI + ZagJS | `/study-blog/claude-rpa/DesignSystem/topics/ark-zag-ui.md` |
| DesignSystem / UI候補比較 | `/study-blog/claude-rpa/DesignSystem/topics/ui-candidate-comparison.md` |
| DesignSystem / NovelUI + Theme | `/study-blog/claude-rpa/DesignSystem/topics/novelui-theme.md` |
| DesignSystem / Game UI Architecture | `/study-blog/claude-rpa/DesignSystem/topics/game-ui-architecture.md` |
| DesignSystem / Storage + Desktop | `/study-blog/claude-rpa/DesignSystem/topics/storage-desktop.md` |
| DesignSystem / 導入ロードマップ | `/study-blog/claude-rpa/DesignSystem/topics/adoption-roadmap.md` |
| DesignSystem / 技術リンク集 | `/study-blog/claude-rpa/DesignSystem/topics/link-index.md` |

### ClaudeRPA / Generated Casual Game RPA

| Card | Study file |
|---|---|
| dherault/tower_defense / manual | `/study-blog/generated-rpa/dherault_tower_defense/manual.md` |
| dherault/tower_defense / 目次 | `/study-blog/generated-rpa/dherault_tower_defense/目次.md` |
| frandyjayr/Tower-Defense-Game / manual | `/study-blog/generated-rpa/frandyjayr_Tower-Defense-Game/manual.md` |
| frandyjayr/Tower-Defense-Game / 目次 | `/study-blog/generated-rpa/frandyjayr_Tower-Defense-Game/目次.md` |

---

## 02_ClaudeRPAノートブック目録

実ファイルの保存場所。

### OpenHarness

root:
`C:\00_master\APP\kanban-note01\public\study-blog\claude-rpa\OpenHarness`

files:

- `manual.md`
- `目次.md`
- `topics/autopilot.md`
- `topics/channels_gateway.md`
- `topics/cli_engine_core.md`
- `topics/hooks_permissions_sandbox.md`
- `topics/mcp.md`
- `topics/memory.md`
- `topics/overview.md`
- `topics/provider_auth.md`
- `topics/skills_plugins.md`
- `topics/swarm_multi_agent.md`
- `topics/tools.md`
- `topics/ui_cron.md`

### awesome-harness-engineering

root:
`C:\00_master\APP\kanban-note01\public\study-blog\claude-rpa\awesome-harness-engineering`

files:

- `manual.md`
- `目次.md`
- `topics/overview.md`

### agent-skills-for-context-engineering

root:
`C:\00_master\APP\kanban-note01\public\study-blog\claude-rpa\agent-skills-for-context-engineering`

files:

- `manual.md`
- `目次.md`
- `topics/overview.md`

### second-brain-starter

root:
`C:\00_master\APP\kanban-note01\public\study-blog\claude-rpa\second-brain-starter`

files:

- `manual.md`
- `目次.md`
- `topics/overview.md`

### MultiAgent

root:
`C:\00_master\APP\kanban-note01\public\study-blog\claude-rpa\MultiAgent`

files:

- `00_InBox/oss_candidate_ai-orchestrator_2026-07-09.md`
- `manual.md`
- `目次.md`
- `topics/overview.md`
- `topics/concept-map.md`
- `topics/agent-roles.md`
- `topics/queue-state-workflow.md`
- `topics/git-worktree.md`
- `topics/rust-tauri-solidjs.md`
- `topics/knowledge-factory.md`
- `topics/implementation-roadmap.md`

### DesignSystem

root:
`C:\00_master\APP\kanban-note01\public\study-blog\claude-rpa\DesignSystem`

files:

- `00_InBox/rpa_design_solid_ui_stack_2026-07-09.md`
- `manual.md`
- `目次.md`
- `topics/overview.md`
- `topics/tech-role-map.md`
- `topics/ark-zag-ui.md`
- `topics/ui-candidate-comparison.md`
- `topics/novelui-theme.md`
- `topics/game-ui-architecture.md`
- `topics/storage-desktop.md`
- `topics/adoption-roadmap.md`
- `topics/link-index.md`

---

## 03_Generated RPA資料

Codex側で `rpaJobs` から実処理して作成したRPA資料。

### dherault/tower_defense

root:
`C:\00_master\APP\kanban-note01\public\study-blog\generated-rpa\dherault_tower_defense`

files:

- `manual.md`
- `目次.md`
- `topics/overview.md`
- `topics/state-loop.md`
- `topics/tower-bullet.md`

### frandyjayr/Tower-Defense-Game

root:
`C:\00_master\APP\kanban-note01\public\study-blog\generated-rpa\frandyjayr_Tower-Defense-Game`

files:

- `manual.md`
- `目次.md`
- `topics/overview.md`
- `topics/engine-screen.md`
- `topics/wave-enemy.md`
- `topics/tower-missile.md`

---

## 04_AgentRoom Designer Notebook

RPA側 / AgentRoomに作成したDesigner Notebook。

root:
`C:\00_master\AgentRoom\experiments\DSN01_DesignerNotebook`

files:

- `designer_notebook_arkui_zagjs_designer_agent_2026-07-10.md`
- `designerAgent.md`

index:

- `C:\00_master\AgentRoom\AGENT_INDEX.md`
- `C:\00_master\AgentRoom\registry\agentroom_registry_2026-06-20.md`

要点:

- DesignerAgentはデザイン生成AIではなくDesign Orchestrator。
- DesignStateで `APP / GAME / WEB / DASHBOARD / DESIGNSYSTEM / RESEARCH` を切り替える。
- 原文保持セクションと整理セクションを分離。

---

## 05_次アクション

Claude側で判断してほしいこと:

1. `DesignSystem` 資料を、Note StudyにもRPA本棚として継続追加するか。
2. `DesignerAgent` をAgentRoom ideaのままにするか、testingへ進めるか。
3. `MultiAgent` はNote内試験を続けるか、専用クローンプロジェクトを作るか。
4. `generated-rpa` のCasual Game資料を、次に漢字概念化するか。
5. `rpaJobs` の対象を DesignSystem / MultiAgent / CasualGame で分けるか。

推奨:

```txt
RPA資料は Note Study に集約。
Agent候補は AgentRoom に集約。
実装プロジェクト化するものだけ専用クローンへ移す。
```

---

## 06_補足

Note内Studyのカード定義は次にある。

`C:\00_master\APP\kanban-note01\src\dataBridge\studyLibrary.ts`

Claude側がStudy表示とファイル配置の差分を確認する場合、まずこのファイルを見る。

