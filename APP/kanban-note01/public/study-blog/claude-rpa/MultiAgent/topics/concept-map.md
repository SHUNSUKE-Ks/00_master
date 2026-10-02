# concept-map: CreatorHubへの置き換え

## 概念対応

| MultiAgent概念 | CreatorHub側の対応 | 説明 |
|---|---|---|
| Orchestrator | CreatorHub | 全体目的、作業分配、成果物の統合 |
| Workflow Engine | Harness | 作業手順、再試行、ログ、確認 |
| Worker Agent | Skills / Agent | 実作業を行う役割単位 |
| Tool | Git / Notion / Web / Codex | Agentが使う外部能力 |
| Memory | Study / Report / RAG | 過去資料と参照知識 |
| Queue | Kanban / rpaJobs | 作業待ち、進行中、完了の状態管理 |
| State | Task status / screen state | 何が今どこにあるか |

## 今のNoteとの接続

Note側ではすでに次の部品がある。

```txt
Study
  RPA資料
  漢字概念
  NovelEngine

InBox
  改善案
  task memo

Kanban
  作業状態

rpaJobs
  Firebase上の実行依頼
```

この構造は、軽量Orchestratorの入口として使える。

## 設計メモ

`CreatorHub = Orchestrator` と決めると、Noteは単なるメモではなく、Orchestratorが読む **Knowledge UI** になる。
Study記事、Kanban Report、InBox、rpaJobsは、Agentが動くための入力と状態になる。

