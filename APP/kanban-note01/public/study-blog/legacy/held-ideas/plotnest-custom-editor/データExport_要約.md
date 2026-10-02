# PlotNest / データ・Exportの要約

> 状態: 保留構想。CustomEditorが扱う情報モデルと、Runtime JSONへ出すための初期案。

## データの役割分割

### Event

Sceneや出来事を持つ。tag、Character、Location、次Eventのrelationを参照する。

### Character / Location

Eventへ直接内容を重複して持たせず、ID relationで結ぶ。Characterは登場Event、Locationは初登場や時間帯tagを持つ案だった。

原本: [Zustand Storeのデータモデル](./原本チャット_保管.md#zustand-store具体コード)

## Exportの考え方

```text
Editor内の情報
  -> Runtime JSON
  -> Relation JSON
  -> Prompt JSON
  -> AssetSpec JSON
```

`Runtime JSON` はゲーム実行用、`Relation JSON` は接続確認用、`Prompt JSON` は素材発注用、`AssetSpec JSON` はアセットIDと仕様を渡すための出力として想定されていた。

原本: [ExportCenter](./原本チャット_保管.md#出力と設定)、[Runtime Export](./原本チャット_保管.md#runtime-export構造)

## 現行へ残せる部分

- 表示名とは別に、固定IDでrelationを結ぶ。
- Event / Character / Location / Assetを別データとして扱う。
- Editorの内部表現と、NovelEngineへ渡すRuntime表現を分ける。
- ExportはSchema検証を通す。

## 現行へ持ち込まない部分

- この草案の独自DSL仕様。
- React/Zustandを前提にしたStore実装。
- APIエンドポイント自動生成の前提。

これらは必要になった時に、NovelEngineの既存OneShot / Runtime schemaを正本として設計し直す。
