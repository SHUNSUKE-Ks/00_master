# ui_cron: TUIとCron定期実行

対象ファイル（実読）:
- `src/openharness/ui/app.py`（先頭70行程度参照、320行中）
- `src/openharness/services/cron.py`（先頭60行、137行中）
- README「Terminal UI」節、`frontend/terminal/`ディレクトリ構成（ファイル名のみ確認、中身は未読）

Autopilot（リポジトリ自走サービス）については[topics/autopilot.md](autopilot.md)を参照。

## Terminal UI（React + Ink）

READMEより: `frontend/terminal/`にReact/Ink製のTUIがあり、Pythonバックエンド(`ui/backend_host.py`, `ui/protocol.py`, `ui/react_launcher.py`)とプロトコル越しに繋がる構成（`ui/textual_app.py`もあり、Textual製の代替UIも併存している可能性がある＝未実読で要確認）。

対応インタラクション（README列挙）:
- コマンドピッカー（`/` → 矢印キー → Enter）
- permissionダイアログ（y/n＋詳細表示）
- モード切替（`/permissions`）
- セッション再開（`/resume` → 履歴から選択）
- 実行中アニメーション、コンテキストに応じたキーボードショートカット表示

`frontend/terminal/src/components/`配下のファイル名（`CommandPicker.tsx`, `Composer.tsx`, `ConversationView.tsx`, `SwarmPanel.tsx`, `TodoPanel.tsx`, `ToolCallDisplay.tsx`）から、swarm状態やtodo(タスク)専用パネルがUIレベルで独立していることが分かる。

## Cron — 定期実行registry

`services/cron.py`（先頭60行実読）:
- `croniter`ライブラリでcron式を検証(`validate_cron_expression`)。
- タイムゾーンは`zoneinfo.ZoneInfo`で検証(`validate_timezone`)。
- ジョブは`get_cron_registry_path()`にJSON配列として`atomic_write_text`で保存。
- `next_run_time(expression, base, tz)`で次回実行時刻を計算。
- `tools/cron_create_tool.py` / `cron_delete_tool.py` / `cron_list_tool.py` / `cron_toggle_tool.py`としてツール化されている（このセッションのCronCreate/CronList/CronDeleteと同じ語彙）。

## CreatorHubへの示唆

CreatorHubの自走Loopは現状Windowsタスクスケジューラ任せ（`90_Loop/register_tasks.ps1`）だが、OpenHarnessのように「cronジョブ自体をagentツールとして持つ(CronCreate/CronList/CronDelete)」設計にすると、agent自身が自分の定期実行スケジュールを調整できるようになる。将来Loadout化（`次:4_loadout`）を検討する際の参考。
