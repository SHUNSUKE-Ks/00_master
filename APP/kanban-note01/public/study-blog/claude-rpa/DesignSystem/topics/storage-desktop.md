# storage-desktop: Dexie / Tauri

## Dexie

概念: IndexedDB管理。

役割:

```txt
Inbox
Tags
Gallery
Dictionary
SaveData
```

評価:

| 項目 | 評価 |
|---|---|
| PWA | ◎◎ |
| Android保存 | ◎ |
| Offline | ◎ |
| Firebase同期前の一時保存 | ◎ |

## Tauri

概念: Desktop化。

構成:

```txt
SolidJS + Rust
```

評価:

| 項目 | 評価 |
|---|---|
| 軽量 | ◎◎ |
| ローカルファイル連携 | ◎ |
| Rust backend | ◎ |
| MultiAgent Orchestrator | ◎ |

## 採用方針

PWAではDexie。
Desktop版やMultiAgent専用プロジェクトではTauri。

