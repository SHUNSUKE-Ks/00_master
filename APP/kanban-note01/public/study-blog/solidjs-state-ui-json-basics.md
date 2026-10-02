# SolidJS 基礎：Stateから画面を作る

Note_Storyを作るために必要なSolidJSの基礎を、State、表示、遷移、UI追加、JSON連携に分けて整理する。

## 要点

| Key | 意味 |
| --- | --- |
| 状態 | 画面やデータの現在値 |
| 更新 | Stateを書き換える処理 |
| 表示 | Stateを読んでUIを出す処理 |
| 遷移 | 現在の画面Stateを切り替える処理 |
| 部品 | 画面の一部をComponentに分けたもの |
| 接続 | JSON、localStorage、Firebaseなど外部データとつなぐ処理 |

## 01 Stateとは何か

### Stateは画面の現在地

画面に何を出すかは、Stateで決める。

```ts
// 状態：現在表示しているページを持つ。
const [page, setPage] = createSignal<'note' | 'gallery' | 'study'>('note')
```

### createSignal

小さい値を持つときに使う。

```ts
// 状態：開閉だけを持つ。
const [open, setOpen] = createSignal(false)

// 更新：ボタンで開閉を反転する。
setOpen((value) => !value)
```

### createStore

アプリ全体のように、複数の値をまとめて持つときに使う。

```ts
// 状態：アプリ全体の現在地をまとめる。
const [state, setState] = createStore({
  page: 'note',
  selectedNotebookId: null,
  selectedPageId: null,
  inboxOpen: false,
})
```

## 02 画面を表示する

### Show

条件に合うときだけ表示する。

```tsx
// 表示：pageがstudyのときだけStudy画面を出す。
<Show when={state.page === 'study'}>
  <PageStudy />
</Show>
```

### For

配列を一覧表示する。

```tsx
// 表示：Card一覧をStateから作る。
<For each={cards}>
  {(card) => (
    <button onClick={() => openCard(card.id)}>
      {card.title}
    </button>
  )}
</For>
```

### classList

Stateに応じて見た目を変える。

```tsx
// 表示：選択中のCardだけactiveにする。
<button
  class="card"
  classList={{ active: selectedId() === card.id }}
>
  {card.title}
</button>
```

## 03 画面遷移を作る

### PageをStateで持つ

ルーティングを大きく作らなくても、まずはStateで画面を切り替えられる。

```ts
type Page = 'note' | 'inbox' | 'study' | 'gallery'

// 遷移：現在ページを切り替える。
function navigate(next: Page) {
  setState({ page: next })
}
```

### Headerから遷移する

```tsx
// 操作：HeaderボタンからStudyへ移動する。
<button onClick={() => navigate('study')}>
  Study
</button>
```

### 戻る処理

戻るときは、どのStateを消すかを決める。

```ts
// 戻路：Page本文から、同じNotebookのPage一覧へ戻す。
function backToPageList() {
  setState({
    selectedPageId: null,
    mobileShelfMode: 'pages',
  })
}
```

## 04 UIを追加する

### 小さいUIはComponentに分ける

```tsx
// 部品：再利用できるCardボタン。
const StudyCard = (props: { title: string; summary: string; onClick: () => void }) => (
  <button class="study-card" onClick={props.onClick}>
    <strong>{props.title}</strong>
    <span>{props.summary}</span>
  </button>
)
```

### Buttonを追加する場所

```tsx
// 操作：既存HeaderにInBoxボタンを追加する。
<button class="inbox-button" onClick={() => setState({ inboxComposerOpen: true })}>
  InBox
</button>
```

### CSSは役割名で付ける

```css
/* 外観：Study Cardの基本形。 */
.study-card {
  border: 1px solid #39393d;
  border-radius: 8px;
  background: #242427;
}
```

## 05 JSONと連携する

### JSONは型を決める

```ts
// 型定：InBoxに保存する1件の形。
type InboxItem = {
  id: string
  subject: string
  body: string
  tag: string
  status: 'inbox' | 'working' | 'done'
}
```

### localStorageに保存する

```ts
// 保存：Stateをブラウザ内に保存する。
localStorage.setItem('note-inbox', JSON.stringify(state.inboxItems))
```

### localStorageから読む

```ts
// 復帰：保存済みJSONをStateに戻す。
const saved = localStorage.getItem('note-inbox')
const items = saved ? JSON.parse(saved) as InboxItem[] : []
setState({ inboxItems: items })
```

### Firebaseへ送る

```ts
// 接続：Firebaseへ送る前に、JSONとして扱いやすい形に整える。
const payload = {
  type: 'idea_inbox',
  subject: item.subject,
  body: item.body,
  tag: item.tag,
  createdAt: new Date().toISOString(),
}
```

## 06 よく使う分け方

### Store

Stateと更新関数を置く。

### Page

画面全体を置く。

### Component

画面の一部を置く。

### DataBridge

JSON、Firebase、Exportなど外部接続を置く。

### CSS

見た目だけを置く。

## 07 Note_Storyでの対応

### Header

画面遷移とGlobal InBoxを持つ。

### PageNotebook

ノート、ページ、会話ログ、階層ステップを持つ。

### PageStudy

学習用Cardを表示する。

### MarkdownView

Markdown本文を読みやすいHTMLに変換して表示する。

### store/index

アプリ全体のStateと更新処理を持つ。

## 08 最初に覚える順番

1. `createSignal`
2. `createStore`
3. `<Show>`
4. `<For>`
5. `onClick`
6. `setState`
7. `Component分割`
8. `JSON保存`
9. `Firebase同期`
10. `PWA確認`
