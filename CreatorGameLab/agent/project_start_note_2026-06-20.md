# CreatorGameLab Project Start Note

meta:
  date: 2026-06-20
  owner: codex
  status: starting
  project: CreatorGameLab
  related_app: C:\00_master\APP\novelEngine

## summary

CreatorGameLabとnovelEngineの接続プロジェクトを開始する。

CreatorGameLabは、Dashboard / Title Select / Engine Sandbox / Dev Save Load / Component Registry / Workspace Placeholderを持つ。

novelEngineは、Engine Model第一号として扱い、まず原本を守りながらDevLayer実験と素材読み込み確認を進める。

## current CreatorGameLab

```txt
C:\00_master\CreatorGameLab
```

状態:

- SolidJS + Viteアプリ
- `npm run dev` は `127.0.0.1:5194`
- `public/data-sources` に外部データを置く設計
- `source-manifest.json` でactiveSourceを切り替える
- `_devindex` と `public/data-sources/sample/devindex` に初期データあり

## current novelEngine

```txt
C:\00_master\APP\novelEngine
```

状態:

- SolidJS + Viteアプリ
- scenario_main.jsonあり
- scenario_delivery_schemaあり
- Character / 背景 / BGM素材あり
- SEは計画データのみで実path未設定
- `npm run smoke:assets` で素材確認可能

## first connection idea

CreatorGameLab側では、novelEngineを直接改造しない。

まず以下を参照・登録する。

- Engine Model: novelEngine
- Data Source: novelEngine scenario / schema / devlayer候補
- Layout Sheet: wide / android portrait
- UI Sheet: novel_soft_dark
- Report: smoke assets結果

## start rule

1. CreatorGameLab側は、まずデータソースと表示を整える。
2. novelEngine本体の変更は、別TaskTicketで扱う。
3. Layout確認が必要なものはScaffoldへ進める。
4. Fast Runできる資料整理はReport / Phase TODOで進める。

## next candidates

1. CreatorGameLabにnovelEngine Engine Modelカードを追加する。
2. `public/data-sources/sample/devlayers` のDevLayer候補をDashboardから辿れるようにする。
3. novelEngine Smoke Test ReportへのリンクをCreatorGameLab側の資料として表示する。
4. Title SelectでEngine Model / Layout Profile / UI Sheet選択をより明確にする。

