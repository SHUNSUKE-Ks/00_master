# PlotNest / React実装草案（保留）

> 状態: 保留。原本はReact、Zustand、React Routerを前提にしている。
>
> 注意: 現行の主軸はSolidJSであるため、このコードをそのまま採用しない。

## 草案に含まれていたもの

### Zustand Store

Event、Character、Locationを `Record` で保持し、CRUD関数をStoreに集める案。

原本: [Zustand Store具体コード](./原本チャット_保管.md#zustand-store具体コード)

### Router

`Dashboard`、`InBox`、`EventEditor`、`CharacterDB`、`LocationDB`、`ExportCenter`、`Settings` をURL routeで分ける案。

原本: [ルーティング雛形](./原本チャット_保管.md#ルーティング雛形)

### InBox UI

タイトルと本文を受け取り、Eventを追加して縦Cardで表示する最小案。

原本: [InBox UIモック](./原本チャット_保管.md#inbox-uiモック設計)

### Export Service

Storeを読んでRuntime JSONを組み立て、Blobダウンロードする案。

原本: [Export JSON設計](./原本チャット_保管.md#export-json設計詳細)

## 現行SolidJSへ読み替える場合

| 草案 | 現行で検討する置換先 |
| --- | --- |
| Zustand | `createStore` / `createSignal` |
| React Router | `@solidjs/router` またはアプリ内画面State |
| React Component | Solid Component |
| Storeから直接export | DataBridge / Export層 |

この資料は「機能の候補」を残すための保管であり、実装の正本ではない。
