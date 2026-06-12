# カンバン用 context 参照パス

`kanban_June` の task、GitHub Issue、Codex prompt に貼るための参照ブロックです。

## コピー用ブロック

```text
[00_master Command Context]
Root: C:\00_master

Brain:
- Overview: C:\00_master\Brain\README.md
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
- Note app: C:\00_master\APP\Note

Important notes:
- Note app is for broad and messy notes.
- Kanban context should stay narrower: tasks, reports, agent status, skill references, hooks, and execution state.
- Use Brain\ContextBlocks when a task needs a compact copyable context block.
```

## 使い分け

- `APP\Note` は雑多なメモ、資料、ギャラリー、ノート DB を扱う場所です。
- `DevApps\kanban_June` は task、agent、skill、report、hook の状態を見える化する場所です。
- `Brain` は両者の間にある知識・参照・整理の層です。
