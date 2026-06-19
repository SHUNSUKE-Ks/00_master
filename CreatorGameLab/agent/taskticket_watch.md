# CreatorGameLab TaskTicket Watch

## 目的

CreatorGameLab Agentが、自分の作業対象を見つけるための確認手順。

## 確認する場所

TaskTicket:

```txt
C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\taskticket
```

Kanban / Report:

```txt
C:\00_master\DevApps\kanban_June\docs
```

現在のPhase TODO:

```txt
C:\00_master\DevApps\kanban_June\docs\creator_game_lab_current_status_phase_todo_2026-06-19.md
```

## 開始判断

次の条件を満たしたら作業候補にする。

- targetまたはtopicがCreatorGameLab
- phaseが未完了
- nextまたはtodoが明確
- 触るべきファイルがCreatorGameLab配下、またはCreatorHubのCreatorGameLab設計資料

## 開始してはいけない例

- `APP\novelEngine` 本体を直接変えるTask
- `APP\Note` の未コミット変更を含むTask
- Git原本保存確認が必要なTask
- 画面仕様が未確定の新機能

## 推奨優先順

1. Safety / Restore
2. Data Source / Schema
3. TitleSetupView
4. Save Slot / Step TODO
5. Workspace Placeholder接続
6. Report / Kanban登録

## 作業開始時のチェック

```powershell
cd C:\00_master
git status --short -- CreatorGameLab CreatorHub\LIBRARY\DESIGN\CreatorGameLab DevApps\kanban_June\docs
```

必要なら:

```powershell
cd C:\00_master\CreatorGameLab
npm run build
```

dev serverは自動起動しない。

起動が必要な場合は、ユーザーへコマンドを渡す。

```powershell
cd C:\00_master\CreatorGameLab
npm run dev
```

