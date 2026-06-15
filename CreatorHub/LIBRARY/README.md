# CreatorHub LIBRARY

`CreatorHub\LIBRARY` は、素材、DB、制作ツール、発注、索引をまとめる場所です。

## 役割

- 素材ファイルを保管する。
- 素材DB、シナリオDB、キャラクターDB、発注DBを置く。
- DevStudio や AssetCollectionApp などの制作ツールを置く。
- `GAME` 配下のエンジンが読む共通スキーマを管理する。
- AI が最初に読む目次を `INDEX` に置く。

## 構成

```txt
C:\00_master\CreatorHub\LIBRARY
├─ APP
├─ DATABASE
├─ MATERIALS
├─ DOCS
├─ INDEX
└─ ORDER
```

## 読み方

AI が作業を始めるときは、まず次を確認します。

1. `INDEX\workspace_index.json`
2. `DOCS\novel_engine_asset_architecture.md`
3. `DOCS\experiment_to_production_flow.md`
4. 対象エンジンの `C:\00_master\GAME\...\README.md`

