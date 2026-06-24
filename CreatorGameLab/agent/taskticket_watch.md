# CreatorGameLab TaskTicket Watch

## 目的

CreatorGameLab Agentが、自分の作業対象を見つけるための確認手順。

Kanban_Juneは作業開始を毎回止める司令塔ではなく、Reportを受けてReview、進捗整理、次TODO整理、知識化を行う場所として扱う。

CreatorGameLab Agentは、明示されたTaskTicketや複数日にまたがる作業ではこのWatchを使う。APP側の短い修正、UI確認、素材整理、試行錯誤は、必要な資料を確認したうえで進め、作業後にReportで返す。

## 確認する場所

推奨コマンド:

```powershell
cd C:\00_master
node AgentRoom\commands\agent-task-pull.mjs --agent creator_game_lab_agent
```

このコマンドは、Kanban_JuneのTaskTicketからCreatorGameLab Agent担当候補を抽出し、Start PromptとPull Reportを作る。

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
