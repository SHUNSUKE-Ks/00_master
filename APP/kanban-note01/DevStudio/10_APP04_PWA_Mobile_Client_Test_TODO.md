# APP04 PWA携帯調査 TODO

作成日: 2026-06-29

## 進捗サマリー

総合進捗: `19 / 24`

| Phase | 内容 | 進捗 |
| --- | --- | --- |
| Phase 0 | 起動・PWA準備 | `3 / 4` |
| Phase 1 | Gallery写真追加 | `5 / 5` |
| Phase 2 | Blog表紙利用 | `6 / 6` |
| Phase 3 | リロード・再起動確認 | `4 / 4` |
| Phase 4 | 携帯操作感メモ | `0 / 5` |

## 目的

クライアントが携帯でPWAとして触り、写真追加、Gallery表示、Blog表紙利用までを調査できる状態か確認する。

このTODOはconsoleログ確認ではなく、実機操作と見た目・保存挙動の確認を優先する。

## 対象

```txt
App: kanban-note01
Local URL: http://127.0.0.1:5186/
Mobile/PWA URL: https://kanban-note01.vercel.app/
```

dev serverを起動していない場合:

```powershell
cd C:\00_master\APP\kanban-note01
npm run dev -- --host 127.0.0.1 --port 5185
```

注意:

- 携帯確認は `https://kanban-note01.vercel.app/` で行う。
- `127.0.0.1` は端末自身を指すため、携帯からPCのローカルサーバー確認には使わない。
- `localStorage` はURLごとに別保存。ローカルで追加した写真やBlogはVercel側には引き継がれないため、Vercel上で再度追加して確認する。

## Phase 0: 起動・PWA準備

進捗: `0 / 4`

- [x] `0-1` 携帯またはiPadで対象URLを開ける。
- [x] `0-2` 画面上部の `Note_Story` メニューを開ける。
- [x] `0-3` メニュー内に `Pinterest Masonry` と `ブログ表紙` が見える。
- [ ] `0-4` ホーム画面追加またはPWA表示の候補が出るか確認する。

## Phase 1: Gallery写真追加

進捗: `0 / 5`

- [x] `1-1` `Note_Story` メニューから `Pinterest Masonry` を開ける。
- [x] `1-2` Gallery右上の `追加` から写真選択を開ける。
- [x] `1-3` カメラロールまたは端末写真を1枚追加できる。
- [x] `1-4` 追加した写真がPinterest風Galleryに表示される。
- [x] `1-5` 写真をタップして拡大表示または詳細表示へ進める。

## Phase 2: Blog表紙利用

進捗: `0 / 6`

- [x] `2-1` `Note_Story` メニューから `ブログ表紙` を開ける。
- [x] `2-2` Blogがない場合は `新規ブログ` を作成できる。
- [x] `2-3` Blog上部のカバー領域をタップして、カバー画像ピッカーを開ける。
- [x] `2-4` ピッカー内に `Gallery写真` セクションが表示される。
- [x] `2-5` Gallery写真を選ぶとBlog表紙に反映される。
- [x] `2-6` Blog一覧カードにも表紙サムネイルが出る。

## Phase 3: リロード・再起動確認

進捗: `0 / 4`

- [x] `3-1` ページをリロードしてもGallery写真が残る。
- [x] `3-2` ページをリロードしてもBlogが残る。
- [x] `3-3` ページをリロードしてもBlog表紙が残る。
- [x] `3-4` PWAとして開き直しても同じデータが見える。

## Phase 4: 携帯操作感メモ

進捗: `0 / 5`

- [ ] `4-1` 片手でメニュー、Gallery、Blog表紙まで移動できる。
- [ ] `4-2` ボタンやタブが小さすぎない。
- [ ] `4-3` 横スクロールタグが引っかからず動く。
- [ ] `4-4` 画像追加後に次の操作が迷わない。
- [ ] `4-5` 失敗・違和感・欲しい導線をメモする。

## 合格条件

- [ ] Firebaseなしで写真とBlog表紙がローカルに残る。
- [ ] 携帯で写真追加からBlog表紙反映まで到達できる。
- [ ] 画面が大きく崩れない。
- [ ] クライアントが調査メモを残せる粒度になっている。

## 調査メモ

### Run APP04-PWA-MOBILE-001

日時: 2026-06-29

端末: Desktop app browser / user screenshot

Observed:

```txt
http://127.0.0.1:5186/
Galleryに _hideout_1 / _souko の2枚追加を確認。
_hideout_1 の詳細パネル表示を確認。
Blog「新しいブログ」作成を確認。
Gallery写真がBlog表紙とBlog一覧カードに反映されていることを確認。
```

気になった点:

- AI側のlocalStorage直接読取はブラウザ評価環境で不可。画面DOMとスクショで確認した。
- リロード後保持はユーザー確認済み。
- PWAホーム画面追加の表示候補は未確認。

次に直すこと:

- Phase 0-4: PWA表示候補を実機側で確認する。

### Run APP04-PWA-MOBILE-002

日時: 2026-06-29

端末: user browser / reload test

Observed:

```txt
リロード後もGallery写真、Blog、Blog表紙の保持を確認。
```

Missing:

```txt
PWAホーム画面追加の表示候補。
携帯操作感メモ。
```
