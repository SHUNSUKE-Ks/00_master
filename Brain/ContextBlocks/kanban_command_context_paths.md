# カンバン用 context 参照パス

`kanban_June` の task、GitHub Issue、Codex prompt に貼るための参照ブロックです。

## コピー用ブロック

```text
[00_master Command Context]
Root: C:\00_master

Brain:
- Overview: C:\00_master\Brain\README.md
- Master Index: C:\00_master\Brain\00_Index
- Original Templates: C:\00_master\Brain\1000_OriginalTemplates
- BrainAgent: C:\00_master\Brain\BrainAgent
- GitInBox: C:\00_master\Brain\GitInBox
- CommandModules: C:\00_master\Brain\CommandModules
- Reports: C:\00_master\Brain\Reports
- TechStack: C:\00_master\Brain\TechStack
- Inbox: C:\00_master\Brain\Inbox
- FolderStructure: C:\00_master\Brain\FolderStructure
- Packages: C:\00_master\Brain\Packages
- ContextBlocks: C:\00_master\Brain\ContextBlocks

Agent / Skill / Hook modules:
- AgentRoom: C:\00_master\Brain\CommandModules\AgentRoom
- SkillsLibrary: C:\00_master\Brain\CommandModules\SkillsLibrary
- Hooks: C:\00_master\Brain\CommandModules\Hooks
- ModuleRegistry: C:\00_master\Brain\CommandModules\ModuleRegistry

Apps:
- Kanban monitor app: C:\00_master\DevApps\kanban_June
- Note original template: C:\00_master\APP\Note
- Kanban note app: C:\00_master\APP\kanban-note01

Important notes:
- APP\Note is the original reusable Note template.
- APP\kanban-note01 is the project-specific note app for Brain / kanban_June.
- Kanban context should stay narrow: tasks, reports, agent status, skill references, hooks, and execution state.
- Use Brain\ContextBlocks when a task needs a compact copyable context block.
```

## 使い分け

- `APP\Note` は汎用 Note 原本テンプレートです。
- `APP\kanban-note01` は雑多なメモを整理し、カンバンに渡す context を選別する専用ノートです。
- `DevApps\kanban_June` は task、agent、skill、report、hook の状態を見える化する場所です。
- `Brain` は両者の間にある知識・参照・整理の層です。
