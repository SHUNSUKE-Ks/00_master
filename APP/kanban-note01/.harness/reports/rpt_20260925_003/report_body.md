# Card Viewを紺グレーと白枠に変更

## 完成状態

- Card Viewの背景は濃い紺グレー。
- カードは濃いグレーに白枠を付け、タイトル・本文の入力欄を同じ面に見せる。
- ダークモード時も専用スタイルを適用する。

## 変更内容

- src/pages/PageMemo.tsxのCard Viewへ専用クラスを付与した。
- src/index.cssにCard Viewの背景、カード、入力欄、切替ボタンの色を定義した。
- メモの内容と保存処理は変更していない。

## 検証結果

- npm run build 成功。
- git diff --check エラーなし。
- ブラウザーでの視覚確認は未実施。

## 成果物

- src/pages/PageMemo.tsx
- src/index.css

## 次の行動

- 利用者の画面でCard Viewの読みやすさを確認する。
