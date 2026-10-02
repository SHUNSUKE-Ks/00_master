# rust-tauri-solidjs: Rust / Tauri / SolidJS構成

## 理想構造

Rust / Tauri / SolidJSで作るなら、責務は次のように分ける。

```txt
Tauri Shell
  Rust backend
    orchestrator_core.rs
    agent_registry.rs
    task_queue.rs
    workflow_engine.rs
    skill_loader.rs
    memory_store.rs

  SolidJS frontend
    screen_agent_dashboard.tsx
    screen_task_queue.tsx
    screen_workflow.tsx
    screen_memory.tsx
```

## Rust側

| ファイル | 役割 |
|---|---|
| `orchestrator_core.rs` | 全体の指揮、Task分配、Workflow開始 |
| `agent_registry.rs` | Agent定義、能力、実行可否 |
| `task_queue.rs` | Queue、Status、優先度 |
| `workflow_engine.rs` | 状態遷移、再試行、完了条件 |
| `skill_loader.rs` | Skill定義の読み込み |
| `memory_store.rs` | RAG、過去Report、Study参照 |

## SolidJS側

| 画面 | 役割 |
|---|---|
| Agent Dashboard | Agent状態、担当、実行中Task |
| Task Queue | 未着手、実行依頼、確認中、完了 |
| Workflow | Taskの依存関係、分岐、再試行 |
| Memory | Study / Report / InBox / RAGの参照 |

## 初期実装では省略してよいもの

- Rust化
- Tauri化
- 並列実行
- 自動Git操作
- 自動Deploy

最初はNote内のStudy / rpaJobs / Markdown出力だけで良い。
設計を固めてからTauriへ移す。

