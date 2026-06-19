# CreatorGameLab

CreatorGameLabは、制作途中の作業やプロジェクトを一目で再開するためのDashboard / Hosting Shellです。

Workspace本体はこのScaffoldでは実装せず、遷移先のワイヤーフレームだけを確保します。

## 最重要ルール: ひな型とデータを分離する

CreatorGameLabでは、Dashboardの見た目・遷移・状態管理と、中に流す作業データを完全に分ける。

AIがデータを追加・差し替えたい場合、原則として `src/views`、`src/components`、`src/styles.css` を変更しない。
変更するのは `public/data-sources` 配下のJSONと `source-manifest.json` だけにする。

```txt
C:\00_master\CreatorGameLab
├─ src
│  ├─ views        ... 画面テンプレート。データ追加では触らない。
│  ├─ components   ... 表示部品。データ追加では触らない。
│  ├─ state        ... App Phase / View Phaseなど。データ追加では触らない。
│  └─ data         ... DataSource読み込み層。Schema変更時だけ触る。
└─ public
   └─ data-sources
      ├─ source-manifest.json
      └─ sample
         └─ devindex
            ├─ game-title.registry.json
            ├─ engine-sandbox.registry.json
            ├─ layout-profile.registry.json
            ├─ dev-save-slots.json
            ├─ component-view.registry.json
            └─ migration-queue.registry.json
```

## データソースの差し替え

現在の読み込み入口は次。

```txt
C:\00_master\CreatorGameLab\public\data-sources\source-manifest.json
```

`activeSource` に指定されたSourceの `basePath` を読み込む。

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

別データに差し替える場合:

1. `public/data-sources/{new_source_id}/devindex` を作る。
2. そこへ6つのJSONを置く。
3. `source-manifest.json` の `sources` に追加する。
4. `activeSource` を `{new_source_id}` に変える。
5. dev serverを表示中ならブラウザをリロードする。

Vite dev serverは `public` 配下のファイルを配信するため、監視・差し替え対象フォルダーは `public/data-sources/{source_id}/devindex` と考える。
どのフォルダーを監視対象にするかは、`source-manifest.json` の `activeSource` と `basePath` で決める。

外部フォルダーの実データを使う場合は、まずこの配下へコピーまたは同期する。
ブラウザアプリはWindowsの任意パスを直接読むことはできないため、`C:\00_master\CreatorGameLab\public\data-sources` をアプリに見せる公開境界にする。

## Data Source Schema

各Sourceには次の6ファイルが必要。

```txt
game-title.registry.json
engine-sandbox.registry.json
layout-profile.registry.json
dev-save-slots.json
component-view.registry.json
migration-queue.registry.json
```

TypeScript側の型は次に集約する。

```txt
C:\00_master\CreatorGameLab\src\data\schema.ts
```

読み込み処理は次に集約する。

```txt
C:\00_master\CreatorGameLab\src\data\devindex.ts
```

AI向け判断:

- データの数や内容を増やすだけなら `public/data-sources` だけを編集する。
- JSON項目の意味を増やすなら `src/data/schema.ts` を先に更新する。
- 画面の見せ方を変える時だけ `src/views` と `src/components` を更新する。
- データ読み込みに失敗したら、画面側を直す前に `source-manifest.json` と6つのJSONの存在を確認する。

## Title Engine / Layout Selection

Titleは、3つのEngineそれぞれについて `modelId` と `version` を選ぶ。

```txt
AdventureEngine -> model/version
BattleEngine -> model/version
CollectionEngine -> model/version
```

加えて、最初に使う画面レイアウトを `layoutProfileId` で選ぶ。

例:

```txt
android_portrait_standard
android_landscape_standard
desktop_editor_standard
```

Title作成時の予定導線:

```txt
New Title
  -> Engine model/version selection
  -> Layout profile selection
  -> Title Save Slots
  -> Workspace
```

## 起動

```powershell
cd C:\00_master\CreatorGameLab
npm install
npm run dev
```

dev serverは `http://127.0.0.1:5194/` で起動します。

## 確認

```powershell
npm run build
```
