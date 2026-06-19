# novelEngine 復元メモ 2026-06-19

## 目的

`C:\00_master\APP\novelEngine` をCreatorGameLab接続用のEngine Model第一号として扱う前に、原状復帰できる状態を明文化する。

この文書は、novelEngineを直接編集する前に読む。

## 原本パス

```txt
C:\00_master\APP\novelEngine
```

## 移植元

```txt
C:\Users\enjoy\InBox2026\InBox0601\06_AppList\solidjs-novel-engine-01-short-schema
```

## 現在の役割

`novelEngine` は、One JSON形式の短編ノベルを確認するためのSolidJS + Viteアプリ。

現在は次の流れを確認するためのEngine Model候補として扱う。

```txt
scenario_main.json
  -> State
  -> Title Screen
  -> Novel Screen
  -> End Screen
```

CreatorGameLab上では、AdventureEngineの最初のEngine Model候補として扱う。

```txt
modelId: novel_engine_one_json_v1_1
sourcePath: C:\00_master\APP\novelEngine
```

## 起動方法

```powershell
cd C:\00_master\APP\novelEngine
npm install
npm run dev -- --host 127.0.0.1 --port 5177
```

## Build確認

```powershell
cd C:\00_master\APP\novelEngine
npm run build
```

## 主要ファイル

```txt
C:\00_master\APP\novelEngine\src\data\scenario\scenario_main.json
C:\00_master\APP\novelEngine\src\stores\gameStore.js
C:\00_master\APP\novelEngine\src\screens\00_GameManager\GameManager.jsx
C:\00_master\APP\novelEngine\src\screens\10_Title\TitleScreen.jsx
C:\00_master\APP\novelEngine\src\screens\20_Novel\NovelScreen.jsx
C:\00_master\APP\novelEngine\src\screens\90_End\EndScreen.jsx
C:\00_master\APP\novelEngine\docs\scenario_delivery_schema.schema.json
```

## 触ってよい場所

DevLayer実験のために触ってよい場所:

```txt
C:\00_master\APP\novelEngine\docs
C:\00_master\APP\novelEngine\public\devlayers
C:\00_master\APP\novelEngine\src\devlayer
```

必要になった場合のみ触る場所:

```txt
C:\00_master\APP\novelEngine\src\App.jsx
C:\00_master\APP\novelEngine\src\stores\gameStore.js
C:\00_master\APP\novelEngine\src\screens
```

## 触らない場所

原本性を守るため、初期実験では次を直接作り替えない。

```txt
C:\00_master\APP\novelEngine\src\data\scenario\scenario_main.json
C:\00_master\APP\novelEngine\docs\scenario_delivery_schema.schema.json
```

Scenario差し替えが必要な場合は、まずDevLayer側のJSONで上書き指定を持つ。

## Git運用

推奨ブランチ:

```txt
codex/novel-engine-gamelab-adapter
```

作業前に確認する。

```powershell
cd C:\00_master
git status --short -- APP\novelEngine
```

作業中に戻したい場合は、まず差分を確認する。

```powershell
git diff -- APP\novelEngine
```

未追跡ファイルも含めて捨てる必要がある場合は、必ずユーザー確認後に行う。

## 原状復帰の考え方

安全な復帰順:

1. `git status --short -- APP\novelEngine` を確認する。
2. 変更ファイルを把握する。
3. DevLayer実験ファイルだけなら削除または退避する。
4. Engine本体に変更が入っている場合は、差分をReportしてから戻す。

注意:

- `git reset --hard` はこのプロジェクト全体の他作業も巻き込むため使わない。
- `APP\Note` には別の未コミット変更があるため、novelEngine復帰作業に混ぜない。
- `APP\novelEngine` の作業は、CreatorGameLab側のSchema変更とは分けて考える。

## CreatorGameLabとの接続予定

CreatorGameLab側では、次の情報で参照する。

```txt
engineId: AdventureEngine
modelId: novel_engine_one_json_v1_1
version: 1.1.0
adapterKind: devlayer-overlay
sourcePath: C:\00_master\APP\novelEngine
```

次に必要なもの:

- DevLayer schema
- DevLayer apply処理
- Engine Model Adapter
- TitleごとのDevLayer選択
- Workspaceからの起動/プレビュー導線

