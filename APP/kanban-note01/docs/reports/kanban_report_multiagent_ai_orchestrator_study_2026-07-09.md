# Kanban報告: MultiAgent / ai-orchestrator Studyノートブック追加

meta:
  date: 2026-07-09
  app: APP04 Note_Story
  area: Study / ClaudeRPA / OSS候補DB
  status: Library化済み
  source: user request
  target: Kanban / Study / future CreatorHub clone project

## 概要

`ai-orchestrator` を単体OSSではなく、GitHub Topic / MultiAgent分野の設計資料として扱い、`ClaudeRPA / MultiAgent` ノートブックを追加した。

## 作成したノートブック

root:
  `public/study-blog/claude-rpa/MultiAgent/`

files:
  - `00_InBox/oss_candidate_ai-orchestrator_2026-07-09.md`
  - `目次.md`
  - `manual.md`
  - `topics/overview.md`
  - `topics/concept-map.md`
  - `topics/agent-roles.md`
  - `topics/queue-state-workflow.md`
  - `topics/git-worktree.md`
  - `topics/rust-tauri-solidjs.md`
  - `topics/knowledge-factory.md`
  - `topics/implementation-roadmap.md`

## Study登録

`src/dataBridge/studyLibrary.ts` に `ClaudeRPA / MultiAgent` のStudy Cardを追加。

追加カード:
  - `MultiAgent / ai-orchestrator / 目次`
  - `MultiAgent / ai-orchestrator / manual`
  - `MultiAgent / overview`
  - `MultiAgent / CreatorHub対応表`
  - `MultiAgent / Agent Roles`
  - `MultiAgent / Queue State Workflow`
  - `MultiAgent / Git Worktree`
  - `MultiAgent / Rust Tauri SolidJS`
  - `MultiAgent / Knowledge Factory`
  - `MultiAgent / Implementation Roadmap`

## OSS候補DB登録

`src/dataBridge/ossCandidateDb.ts` に `MultiAgent` genreを追加し、`github/topics/ai-orchestrator` を `Library化済み` として登録。

## 実装意図

次に作る可能性が高い新規プロジェクトの下地として、以下の概念を分割した。

```txt
04_MultiAgent/
  orchestrator/
  agents/
  queue/
  workflow/
  memory/
  skills/
  tools/
  reports/
```

## 次手

1. GitHub Topicから個別OSS候補を3件程度選ぶ。
2. CrewAI / Agent Orchestrator / Open Multi Agent系を比較候補にする。
3. `Planner -> Researcher -> Topic -> Writer` の4Agent構成を最小実装候補にする。
4. CoderAgent導入前に、Queue / Report / Study保存の流れを固定する。

## 判断質問

向こうのチャットで判断してほしいこと:

```txt
Q: 04_MultiAgent / ai-orchestrator は、Note_Storyアプリ内に再現するべきか、
   それともNote_Storyを参考にクローンして、新しいMultiAgent専用プロジェクトとして作るべきか？
```

判断材料:

- Note_Story内で再現する場合:
  - Study / Kanban / InBox / rpaJobs / Firebaseをそのまま使える。
  - ただしNoteアプリの責務がさらに重くなる。
- クローンで新規作成する場合:
  - Rust / Tauri / SolidJS / Orchestrator UIへ伸ばしやすい。
  - Note_Storyは資料・Report・Studyの母艦として残せる。
  - 初期設定とデータ連携は別途必要。

暫定意見:

```txt
まずはNote_Story内でStudy/DB/Reportとして設計を温め、
実装段階で 04_MultiAgent 専用クローンを作るのが安全。
```
