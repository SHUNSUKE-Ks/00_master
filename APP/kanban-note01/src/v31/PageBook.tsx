import { type Component, For } from 'solid-js'
import { db, noteById, notebookById, updateNote } from './store'

// ページを入れる本（ノート）を選ぶ（ページのタイトルの横）。ページDB の notebookId を付け替えるだけ
const PageBook: Component<{ pageId: string }> = (props) => {
  const page = () => noteById(props.pageId)
  const book = () => notebookById(page()?.notebookId)
  return (
    <label class="bn-pagebook" title="このページを入れる本（ノート）">
      <span class="bn-pagebook-cover" classList={{ none: !book() }} style={{ '--hue': String(book()?.hue ?? 28) }} aria-hidden="true">{book()?.cover ?? '本'}</span>
      <select
        aria-label="このページを入れる本"
        value={page()?.notebookId ?? ''}
        onChange={(e) => updateNote(props.pageId, { notebookId: e.currentTarget.value || null })}
      >
        <option value="">本に入れない</option>
        <For each={db.notebooks}>{(b) => <option value={b.id}>{b.title}</option>}</For>
      </select>
    </label>
  )
}

export default PageBook
