※この報告の実装は同日中の訂正で取り消しました。現行の成果は rpt_20260925_002 を参照してください。

# NACC機能のkanban-note01への移植

## 完成状態

- 商品Galleryのカードから商品詳細Viewを開ける。
- 成分カードの文字をカード上で編集できる。タイトル・別名・説明文を保存し、ページ全体の再読み込みは行わない。
- 資料Galleryから画像とPDFを選び、全画面で閲覧して閉じられる。指定PDF2件を初期資料として配置した。

## 変更内容

- 既存のProductとNutrient、nutrientIds・productIdsの関連、更新関数を使った。別名だけ任意フィールドを追加した。
- 端末画像を縮小して商品サムネイルに設定できるようにした。
- Firebase有効時は既存のFirestore更新を使う。無効時はこのアプリで使われているlocalStorage方式で商品・成分の変更部分を保存する。
- 既存の写真Galleryの保存データを維持し、PDF資料と全画面プレビューを追加した。

## 検証結果

- npm run build 成功。TypeScriptとViteビルドが完了した。
- git diff --check でエラーなし。
- 移植元PDF2件の存在と移植先への配置を確認した。ブラウザーでの操作確認は未実施。

## 成果物

- src/pages/PageDb01.tsx
- src/components/GalleryPanel.tsx
- src/db/products.ts
- src/store/index.ts
- src/types/index.ts
- public/documents/nacc-cosmetics-2026-09-20.pdf
- public/documents/nacc-supplements-2026-09-20.pdf

## 次の行動

- 利用者の端末で商品選択、成分保存後の再表示、PDF全画面表示を確認する。

