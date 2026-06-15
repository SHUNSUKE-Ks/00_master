# CreatorGameLab 実装チェックリスト

## 目的

CreatorGameLab初期実装の抜け漏れを確認する。

このチェックリストは、TaskTicketの完了確認と、Kanban_Juneへの報告に使う。

## 0. 開始前

- [ ] `screen_specs.md` を読んだ
- [ ] `SCAFFOLD_LAYOUT_2026-06-15.md` を読んだ
- [ ] `DEVINDEX_SCHEMA_2026-06-15.md` を読んだ
- [ ] `taskticket` 4件を読んだ
- [ ] 旧 `100_gamecollection` を直接削除・改名しないことを確認した

## 1. Scaffold Shell

- [ ] `C:\00_master\CreatorGameLab` が存在する
- [ ] SolidJS + Vite + TypeScriptで作成されている
- [ ] `lucide-solid` が入っている
- [ ] `src/shell/AppShell.tsx` がある
- [ ] `src/shell/Sidebar.tsx` がある
- [ ] `src/state/labState.ts` がある
- [ ] Sidebarから4画面を選べる
- [ ] `CG_SHELL_NAV` が出る

## 2. _devindex

- [ ] `_devindex/game-title.registry.json` がある
- [ ] `_devindex/engine-sandbox.registry.json` がある
- [ ] `_devindex/component-view.registry.json` がある
- [ ] `_devindex/migration-queue.registry.json` がある
- [ ] `_devindex/dev-save-slots.json` がある
- [ ] 読み込み成功時に `CG_DEVINDEX_LOAD` が出る
- [ ] 読み込み失敗時にFallback画面と `CG_DEVINDEX_FALLBACK` が出る

## 3. Hub Views

### Title Select

- [ ] title registryからタイルが描画される
- [ ] titleを選択できる
- [ ] `Open` でWorkspace Placeholderへ遷移する
- [ ] `Resume` でWorkspace Placeholderへ遷移する
- [ ] `CG_TITLE_TILE` / `CG_TITLE_OPEN` / `CG_TITLE_RESUME` が出る

### Engine Sandbox

- [ ] engine registryからCardが描画される
- [ ] Adventure / Battle / Collectionが見える
- [ ] Isolated Testが見える
- [ ] `Open Sandbox` でWorkspace Placeholderへ遷移する
- [ ] `CG_ENGINE_CARD` / `CG_ENGINE_OPEN` が出る

### Dev Save / Load

- [ ] save slotsからResume Pointが描画される
- [ ] slotを選択できる
- [ ] `Resume` でWorkspace Placeholderへ遷移する
- [ ] `CG_SAVE_ROW` / `CG_SAVE_RESUME` が出る

### Component Registry

- [ ] component registryから一覧が描画される
- [ ] componentKeyが見える
- [ ] migrationStatusが見える
- [ ] `CG_COMPONENT_ROW` が出る

## 4. Workspace Placeholder

- [ ] Active Targetが表示される
- [ ] componentKeyが表示される
- [ ] Backで直前のHub画面へ戻れる
- [ ] 直前がない場合はTitle Selectへ戻る
- [ ] componentKeyが存在しない場合はFallback表示になる
- [ ] `CG_WORKSPACE_OPEN` / `CG_WORKSPACE_BACK` / `CG_WORKSPACE_FALLBACK` が出る

## 5. Build / Report

- [ ] `npm run build` が通る
- [ ] dev server起動コマンドをユーザーへ伝えた
- [ ] Kanban_Juneへ実装結果Reportを残した
- [ ] 必要ならTaskTicketの完了状態を更新した

