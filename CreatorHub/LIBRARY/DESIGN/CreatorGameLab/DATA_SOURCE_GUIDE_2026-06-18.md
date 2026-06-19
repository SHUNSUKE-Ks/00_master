# CreatorGameLab Data Source Guide

## 目的

CreatorGameLabのDashboardを、見た目のひな型と流し込むデータに分離する。

データが増えても `src/views` や `src/components` を毎回変更しない。
監視・差し替え対象のフォルダーを変えるだけで、Dashboardに別データを表示できるようにする。

## 公開データ境界

アプリが読むデータは次に置く。

```txt
C:\00_master\CreatorGameLab\public\data-sources
```

ブラウザアプリはWindows上の任意フォルダーを直接監視・読込できない。
そのため外部データは、この `public\data-sources` 配下へコピーまたは同期してから読む。

## Manifest

読み込み入口:

```txt
C:\00_master\CreatorGameLab\public\data-sources\source-manifest.json
```

`activeSource` が現在使うデータセットを決める。

```json
{
  "schemaVersion": "creator-game-lab.data-source.v1",
  "activeSource": "sample",
  "sources": [
    {
      "id": "sample",
      "label": "Sample CreatorGameLab Data",
      "basePath": "/data-sources/sample/devindex"
    }
  ]
}
```

## Source Folder

1つのSourceは次の6ファイルを持つ。

```txt
public\data-sources\{source_id}\devindex
├─ game-title.registry.json
├─ engine-sandbox.registry.json
├─ layout-profile.registry.json
├─ dev-save-slots.json
├─ component-view.registry.json
└─ migration-queue.registry.json
```

## AI向け編集ルール

- 作業やプロジェクトを増やすだけなら `public\data-sources` だけを編集する。
- 表示テンプレートを壊さないため、データ追加だけで `src\views` / `src\components` / `src\styles.css` を変更しない。
- JSONの項目そのものを増やす場合は、先に `src\data\schema.ts` を更新する。
- 読み込み方法を変える場合だけ `src\data\devindex.ts` を更新する。
- `source-manifest.json` の `activeSource` を変えれば、Dashboardに流すデータセットを切り替えられる。

## 実装ファイル

- `C:\00_master\CreatorGameLab\src\data\schema.ts`
- `C:\00_master\CreatorGameLab\src\data\devindex.ts`
- `C:\00_master\CreatorGameLab\public\data-sources\source-manifest.json`
