# memory: 永続的な横断セッション記憶

対象ファイル（実読）:
- `src/openharness/memory/manager.py`（先頭90行、183行中）
- `src/openharness/engine/query_engine.py`（メモリ呼び出し箇所: `_prepare_session_memory`, `_update_session_memory`, `_extract_durable_memories`, `_schedule_auto_dream`）

## 3層構造のメモリ

`QueryEngine`の`submit_message`の`finally`節（[cli_engine_core.md](cli_engine_core.md)参照）から読み取れる、ユーザー応答ごとに走る3段階の処理:

1. **session memory** — `services/session_memory`。`settings.memory.session_memory_enabled`が真かつ`settings.memory.enabled`が真の場合のみ、ターンごとにファイルへチェックポイント保存(`update_session_memory_file`)。セッション再開・auto-compact後も会話状態を保つのが目的。
2. **durable memory extraction** — `services/memory_extract`。`settings.memory.auto_extract_enabled`が真の場合、`extract_memories_from_turn()`をモデル呼び出しで実行し、結果を`memory_extract_last`に記録。失敗時は例外を握りつぶし`memory_extract_last_error`に格納するのみ（会話を止めない設計）。
3. **auto dream** — `services/autodream/service.py`の`schedule_auto_dream()`。**fire-and-forget**（awaitしない、`_schedule_auto_dream`はコルーチンを起動するだけで待たない設計と推測される。バックグラウンドでの記憶の統合・整理処理）。

## `add_memory_entry` — memory.mdへの記録メカニズム（manager.py実読）

- `memory_type`, `scope`（`"team"`か否か）, `description`, `tags`を受けて、タイトルをslug化（`[^a-zA-Z0-9]+`を`_`に置換）した上で個別mdファイルを作成/更新。
- **scope="team"の場合は`check_team_memory_secrets(content)`でシークレット混入チェックを行い、検出時は`ValueError`で保存自体を拒否**（チーム共有メモリに秘密情報が漏れることを防ぐガード）。
- **重複排除**: `compute_memory_signature(body, memory_type, category)`で内容のシグネチャを計算し、既存メモリ群から一致するものがあれば新規作成せず上書き（`duplicate.path`を再利用）。同じ内容のメモリが増殖しない設計。
- ファイルロック(`exclusive_file_lock`)で同時書き込みを防止。

## CreatorHubへの示唆

- この階層構造（都度のsession checkpoint／モデルによる自動抽出／バックグラウンド統合(dream)）は、このセッション自身が使っている「memory system」（`C:\Users\enjoy\.claude\projects\...\memory\`、type別frontmatter管理）と役割が近い。特に「重複排除のためにコンテンツのシグネチャで既存メモリと突合する」仕組みは、このワークスペースのmemoryファイルが増え続けたときの整理策として参考になる。
- 「team scopeのメモリ書き込み時にシークレット検査を強制する」設計は、CreatorHubで複数agentがメモリ/報告書を共有領域（`00_InBox`, `03_Library`）に書き込む運用に応用できる発想（現状は未実装）。
