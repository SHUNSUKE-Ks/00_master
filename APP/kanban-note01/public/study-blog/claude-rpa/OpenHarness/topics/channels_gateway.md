# channels_gateway: 外部チャットチャネル統合とohmoゲートウェイ

対象ファイル（実読）:
- `src/openharness/channels/impl/base.py`（141行）
- `src/openharness/channels/adapter.py`（131行）
- `ohmo/gateway/router.py`（31行）
- `ohmo/gateway/service.py`（先頭100行、450行中）
- `ohmo/runtime.py`（218行）

## 何のモジュール群か

Slack/Discord/Telegram/Feishu/DingTalk/Email/Matrix/MoChat/QQ/WhatsAppといった外部チャットプラットフォームとOpenHarnessのエージェントループ（`QueryEngine`）を橋渡しする層。`src/openharness/channels/`が汎用のチャネル抽象＋バス、`ohmo/gateway/`がohmo個人エージェント向けの常駐サービス（複数ユーザー・複数セッションのルーティング）を担う。

## 主要ファイル

- `src/openharness/channels/impl/base.py` — `BaseChannel`抽象基底クラス（全チャネル実装の共通契約）
- `src/openharness/channels/adapter.py` — `ChannelBridge`（MessageBus ⇔ QueryEngineの橋渡し）
- `src/openharness/channels/bus/{events,queue}.py` — `InboundMessage` / `OutboundMessage` / `MessageBus`（未実読、importから型を確認）
- `src/openharness/channels/impl/{slack,discord,telegram,feishu,dingtalk,email,matrix,mochat,qq,whatsapp,manager}.py` — 各プラットフォーム実装＋`ChannelManager`
- `ohmo/gateway/{router,service,bridge,config,models,notify,provider_commands,runtime}.py` — ohmo常駐ゲートウェイ本体
- `ohmo/runtime.py` — ohmoバックエンド起動・print modeの実行ヘルパー

## 設計のポイント

### BaseChannel（channels/impl/base.py実読）

- 抽象メソッドは`start()` / `stop()` / `send(msg)`の3つだけ。各チャネル実装はプラットフォームAPIに接続し、受信メッセージを`_handle_message()`経由で`MessageBus`にpublishする責務のみを持つ。
- `is_allowed(sender_id)` — **許可リストが空なら全拒否、`"*"`があれば全許可**というフェイルセーフな既定値（`allow_from`未設定時に誤って全開放しない設計）。
- メディアの保存先は`resolve_channel_media_dir(channel_name)`が解決。`OPENHARNESS_CHANNEL_MEDIA_DIR`環境変数 → `OHMO_WORKSPACE`配下 → OpenHarness既定の`get_data_dir()/media`の優先順位。ohmoワークスペースかどうかで保存先を自動的に切り替える。

### ChannelBridge（channels/adapter.py実読）

- 1つの`QueryEngine`インスタンスにつき1つの`ChannelBridge`を対応させる設計。`_loop()`が`asyncio.wait_for(bus.consume_inbound(), timeout=1.0)`でポーリングし、受信したら`engine.submit_message()`をストリーミング実行、`AssistantTextDelta`を蓄積して最後に`OutboundMessage`として`publish_outbound`する。
- **例外を握りつぶして`"[Error: failed to process your message]"`を返す**フェイルセーフ設計（1メッセージの処理失敗でブリッジ全体が落ちないようにしている）。

### ohmoゲートウェイのセッションルーティング（gateway/router.py実読）

`session_key_for_message()`が、1対1チャットとグループチャットでセッションキーの粒度を切り替える:

- 通常のプライベートチャット: `channel:chat_id`（既存の長期セッションをそのまま再開できる）
- グループ/共有チャット（`chat_type in {group, chat, supergroup, channel, room}`）: `channel:chat_id:sender_id`を追加し、**同じグループ内の複数人がメモリを共有しないよう分離**
- スレッド返信がある場合はさらに`thread_id`を挟む

この設計により「1人のユーザーに対して1つの長期記憶を持つ個人エージェント」という要件と「グループチャットで複数人から話しかけられても人ごとに文脈を混ぜない」という要件を両立させている。

### OhmoGatewayService（gateway/service.py先頭実読）

- `~/.ohmo/`ワークスペースを初期化し、`MessageBus` / `ChannelManager` / `OhmoSessionRuntimePool` / `OhmoGatewayBridge`を組み立てて常駐させるサービスクラス。
- `write_state()`で`gateway.pid` / `gateway.log` / 状態ファイルを書き出し、`oh gateway status`的なコマンドから稼働状況を確認できるようにしている。
- Feishu向けに「グループを自動作成する」「グループへの参加を歓迎メッセージで通知する」コールバック（`create_group_for_user`, `publish_group_welcome`）を`OhmoSessionRuntimePool`に注入する設計。
- `allow_remote_admin_commands`設定が有効かつ許可コマンドがある場合、起動時に`logger.warning`で明示的に警告を出す（強い権限を持つ設定への注意喚起をログレベルで担保）。

### ohmo runtime（ohmo/runtime.py実読）

`run_ohmo_backend` / `run_ohmo_print_mode` / `launch_ohmo_react_tui`の3系統の起動経路があり、いずれも`build_ohmo_system_prompt()`でシステムプロンプトをohmo向けに差し替え、`extra_skill_dirs` / `extra_plugin_roots`でohmoワークスペース内の`skills/` `plugins/`を追加登録した上で、共通の`run_backend_host` / `build_runtime`（`openharness.ui`側の汎用ランタイム）に委譲する。**ohmo固有の差分は「システムプロンプト」「セッションバックエンド」「メモリバックエンド」「追加skill/pluginディレクトリ」の注入だけ**で、実行エンジン本体（QueryEngine等）はOpenHarness本体のものをそのまま使い回している。

## CreatorHub運用への示唆

- ohmoの「1つの実行エンジンを複数チャネル・複数ユーザーセッションで使い回し、注入するプロンプト/メモリ/skillディレクトリだけを差し替える」構成は、CreatorHubで複数プロジェクト・複数agentロールを横断するときの共通化パターンとして参考になる（app-designer/app-builder/blog-researcherも「実行基盤は同じClaude Code、差分はagent定義ファイルとプロンプト」という点で近い発想）。
- グループチャットのセッションキー分離ロジックは、将来CreatorHubが複数人からの依頼を1つの常駐エージェントで受け付ける構想を持つ場合、そのまま設計の参考にできる。
- `is_allowed`の「空リストは全拒否」という既定値は、外部連携（Notion/Obsidian/Slack等のMCP)の許可設定を書く際のフェイルセーフの型として踏襲する価値がある。
