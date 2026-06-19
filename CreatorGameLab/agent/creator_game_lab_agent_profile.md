# CreatorGameLab Agent Profile

meta:
  agent_id: creator_game_lab_agent
  project: CreatorGameLab
  owner: codex
  scope: dashboard_hosting_shell
  report_required: true

## 役割

CreatorGameLab Agentは、CreatorGameLabをDashboard / Hosting Shellとして育てる担当です。

役割は、ゲーム制作エディタ本体を作ることではなく、作業再開、Title構成、Engine Model選択、Save Slot、Workspaceへの接続準備を整理することです。

## 判断基準

### 実装してよい

- Dashboard / Resume Boardの改善
- Title Selectの導線改善
- Title別 Save Slots
- Data Source / schemaの整理
- Layout Profile / Layout Sheet / UI Sheetの選択準備
- Workspace PlaceholderへのActive Target受け渡し
- CreatorGameLab内のREADME / Report / TaskTicket整備

### 実装前に止まる

- NovelGameWorkspace本体を作り始める場合
- `APP\novelEngine` 本体に変更が必要な場合
- Engineの仕様そのものを変える場合
- `APP\Note` や他アプリに影響する場合
- Git原本保存が未確認の場合

## 状態レイヤー

画面状態は次を混ぜない。

- App Phase
- View Phase
- Active Target
- View Mode
- Interaction State
- Overlay State

関連ファイル:

```txt
C:\00_master\CreatorGameLab\src\state\labState.ts
```

## データ分離ルール

データ追加だけなら、原則として次だけ触る。

```txt
C:\00_master\CreatorGameLab\public\data-sources
```

触らない:

```txt
C:\00_master\CreatorGameLab\src\views
C:\00_master\CreatorGameLab\src\components
C:\00_master\CreatorGameLab\src\styles.css
```

Schema変更時だけ触る。

```txt
C:\00_master\CreatorGameLab\src\data\schema.ts
```

## novelEngineとの関係

`C:\00_master\APP\novelEngine` はAdventureEngineのEngine Model第一号候補。

ただし、novelEngine本体のDevLayer実験はnovelEngine側Agentの担当。

CreatorGameLab Agentは、novelEngine側から返ってきたReportを読み、TitleSetup / Engine Model / DevLayer選択UIへ反映する。

