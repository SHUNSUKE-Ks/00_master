# mcp: Model Context Protocol統合

対象ファイル（実読）: `src/openharness/mcp/client.py`（先頭80行、298行中）

## McpClientManager

- コンストラクタで `server_configs: dict[str, object]` を受け取り、各サーバーの`McpConnectionStatus(name, state, transport)`を`pending`状態で初期化。
- `connect_all()` — 設定の型(`McpStdioServerConfig` / `McpHttpServerConfig`)で分岐し、`_connect_stdio` / `_connect_http`をそれぞれ呼ぶ。対応外の設定は`state="failed"`＋詳細メッセージで記録（例外を投げず状態として持つ設計）。
- `reconnect_all()` — 一旦`close()`して状態をpendingに戻し`connect_all()`をやり直す。
- 公式`mcp`パッケージ（`mcp.ClientSession`, `mcp.client.stdio.stdio_client`, `mcp.client.streamable_http.streamable_http_client`）をそのまま利用 — 独自MCP実装ではなく標準SDK準拠。

## README記載の対応状況

- **HTTP transport対応、切断時auto-reconnect、tool-onlyサーバー互換**（v0.1.5で追加）
- **MCPツール入力のJSON Schema型を自動推論**（手動型マッピング不要、v0.1.5）
- `call_tool` / `read_resource`は切断中のサーバーを例外にせず「gracefully handle」する（v0.1.4で追加）— `McpServerNotConnectedError`という専用例外があることをclient.py冒頭で確認済み。

## CreatorHubへの示唆

このワークスペースは現状Obsidian MCP・Notion MCP・Blender MCP等、複数MCPサーバーを使っている。OpenHarnessの「サーバーごとの接続状態を`state`として保持し、失敗しても例外にせず状態遷移で表現する」設計は、MCP不具合対応ログ（[03_Archive/MCP不具合対応_2026-07-05_report.md](../../../../03_Archive/MCP不具合対応_2026-07-05_report.md)）にある個別対応を、将来的に構造化して管理する際のモデルケースになる。
