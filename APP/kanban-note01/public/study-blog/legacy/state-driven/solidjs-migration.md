# SolidJS移行 / 原文保管

> 作成時期: 2026-05-27 20:04
>
> 状態: 原文保管。導入バージョンや依存関係は現行と異なる可能性がある。

## 当時の疑問

SolidJSゲームテンプレートに含まれていた `zustand` と `motion` はReact向けのため、抜くべきか。

## 当時の結論

- Zustand: 基本不要。SolidJSの `createSignal` / `createStore` を使う。
- motion: UI演出が必要なら残す。ただしCSSアニメーションを優先し、必要時だけJavaScript APIを使う。

## 役割分担

```text
createStore  : ゲーム状態
JSON         : 状態定義
GameManager  : JSONを読んで画面・イベントを動かす
CSS / motion : 画面切替・クリック演出
```

## 当時の推奨構造

```text
src/
├ store/
│ ├ gameStore.ts
│ ├ flagStore.ts
│ └ inventoryStore.ts
└ data/
  ├ state/state_main.json
  └ scenario/scenario_main.json
```

## 現行へ持ち込む時の確認

- SolidJSの状態は `createSignal` / `createStore` を第一候補にする。
- PixiJSの描画状態とSolidJSのUI状態を同じStoreへ無理に混ぜない。
- Ark UI / ZagJSを使う場合は、DialogやMenuなどUI内部の状態機械へ限定して検討する。
- 実装前に対象プロジェクトの依存バージョンと公式ドキュメントを確認する。
