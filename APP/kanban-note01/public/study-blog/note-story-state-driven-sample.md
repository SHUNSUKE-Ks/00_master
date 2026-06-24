# 画面状態と選択

NoteアプリのAndroid版で起きた「戻ると空画面になる」問題から、状態駆動の基本を整理する。

## 要点

### 今回のKey

| Key | 意味 |
| --- | --- |
| 状態 | 画面やデータの現在値 |
| 派生 | Stateから計算する値 |
| 戻路 | 一つ前の階層へ戻る規則 |
| 復帰 | 不整合時に安全な一覧を表示する処理 |
| 境界 | UI、State、保存処理を分ける位置 |

### 状態は画面の現在地である

Noteでは、選択中のNotebookとPageをStateとして持っている。

```ts
// 派生：選択IDから現在のNotebookとPageを求める。
const selectedNotebook = () =>
  state.notebooks.find((item) => item.id === state.selectedNotebookId)

const selectedPage = () =>
  selectedNotebook()?.pages.find((item) => item.id === state.selectedNotebookPageId)
```

画面はこのStateを読み、Title一覧、Page一覧、Page本文のどれを表示するか決める。

## 問題

### 戻る操作で親の状態まで消していた

Page一覧からTitle一覧へ戻る処理で、PageだけでなくNotebookの選択も消していた。
その一方で、Notebook画面では通常Sidebarを表示しないため、選択し直す入口がなくなった。

```ts
// 誤消：Pageだけでなく、親のNotebook選択まで消している。
setSelectedNotebookId(null)
setSelectedPageId(null)
```

## 改修

### 一段上の状態だけを変更する

Page本文から戻る時はPage選択だけを解除し、Notebook選択は保持する。

```ts
// 戻路：Androidの戻る階層は、同じTitleのPage一覧へ戻す。
setSelectedPageId(null)
setMobileShelfMode('pages')
```

Page一覧からTitle一覧へ戻る時も、表示Modeだけを変更する。

```ts
// 一覧：親の選択を保持したまま、Title一覧へ表示を切り替える。
setSelectedPageId(null)
setMobileShelfMode('notebooks')
```

## 状態駆動

### State

現在選択されているNotebook、Page、表示Mode。

### Action

戻る、選択する、開くなど、Stateを変更する入口。

### View

Stateから導かれた現在の画面。View自身を別に保存しすぎない。

```text
操作 Action
  ↓
状態 State
  ↓
表示 View
```

## 再利用

### 親子画面の原則

階層画面で戻る時は、現在階層の選択だけを解除する。
親の選択まで消す場合は、親を再選択できる入口を必ず残す。

### 復帰View

Stateが不整合でも空画面を表示せず、選択可能な一覧をFallbackとして表示する。

```tsx
{/* 復帰：選択が壊れても空画面ではなくTitle一覧を表示する。 */}
<Show when={selectedNotebook()} fallback={<MobileNotebookShelf />}>
  {content}
</Show>
```

## 関連Card

- 派生状態: Stateから選択中データを計算する
- 画面遷移: Module、Card、記事の戻る階層
- Android UI: Sidebarを使わない階層ナビゲーション

## 用語

- State: 画面やデータの現在値
- Action: Stateを変更する操作
- View: Stateを表示へ変換した結果
- Fallback: 必要なStateがない時の代替表示
