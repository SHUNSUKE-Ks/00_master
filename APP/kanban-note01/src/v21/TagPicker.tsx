import { type Component, For, Show, createMemo, createSignal } from 'solid-js'
import { BOOKS, bookSize, bookTags, isTagShown, setTagsShown } from './dictionaries'

// タグ辞書（NovelGameTag）の候補。下書きの横パネルと、会話ログ右のNAV「演出tag」で共通に使う。
// 押すと onPick(タグid)。keepFocus のときは押してもカーソル（入力欄のフォーカス）を動かさない。

const TagPicker: Component<{ onPick: (tagId: string) => void; keepFocus?: boolean }> = (props) => {
  const book = BOOKS[0]
  const firstGroup = book.prefixes.find((p) => p.status !== 'missing')?.group ?? ''
  const [group, setGroup] = createSignal(firstGroup)
  const [query, setQuery] = createSignal('')
  const [editOpen, setEditOpen] = createSignal(false)
  const visibleTags = createMemo(() => {
    const q = query().trim().toLowerCase()
    const pool = q ? book.prefixes.flatMap((p) => bookTags(book, p.group)) : bookTags(book, group())
    return pool.filter((t) => isTagShown(book.meta.id, t.id) && (!q || `${t.id} ${t.label}`.toLowerCase().includes(q)))
  })
  const shownCount = (g: string) => bookTags(book, g).filter((t) => isTagShown(book.meta.id, t.id)).length
  const hold = (e: PointerEvent) => { if (props.keepFocus) e.preventDefault() }

  return (
    <>
      <div class="v21-tag-book">
        <strong>{book.meta.title} Vol{book.meta.volume}</strong>
        <span>{bookSize(book)}件</span>
        <button type="button" class="v21-link" onClick={() => setEditOpen(true)}>表示を選ぶ</button>
      </div>
      <input class="v21-tag-search" placeholder="タグを探す（全分類）" value={query()} onInput={(e) => setQuery(e.currentTarget.value)} />
      <Show when={!query()}>
        <div class="v21-tag-groups" onPointerDown={hold}>
          <For each={book.prefixes}>
            {(p) => (
              <button
                type="button"
                classList={{ on: group() === p.group, missing: p.status === 'missing' }}
                disabled={p.status === 'missing'}
                title={p.status === 'missing' ? '未受領（貼り付けに含まれていなかった）' : `${p.prefix}`}
                onClick={() => setGroup(p.group)}
              >
                {p.label}<small>{p.status === 'missing' ? '未受領' : shownCount(p.group)}</small>
              </button>
            )}
          </For>
        </div>
      </Show>
      <div class="v21-tag-list" onPointerDown={hold}>
        <For each={visibleTags()} fallback={<p class="v21-dim v21-small">出せるタグがありません。「表示を選ぶ」で出す物を選べます。</p>}>
          {(t) => (
            <button type="button" class="v21-tag" onClick={() => props.onPick(t.id)} title="押すとカーソル位置に貼る">
              <code>{t.id}</code>
              <span>{t.label}</span>
            </button>
          )}
        </For>
      </div>

      <Show when={editOpen()}>
        <div class="v21-help-backdrop" onClick={(e) => e.target === e.currentTarget && setEditOpen(false)}>
          <div class="v21-help v21-tag-editor" role="dialog" aria-modal="true" aria-label="候補に出すタグを選ぶ">
            <header class="v21-help-head">
              <div>
                <p class="v21-kicker">辞書 {book.meta.id}</p>
                <h2>候補に出すタグを選ぶ</h2>
                <p class="v21-help-lead">チェックを外したタグは、候補に出しません（この端末に保存）。</p>
              </div>
              <button type="button" class="v21-icon-btn" onClick={() => setEditOpen(false)} aria-label="閉じる">×</button>
            </header>
            <div class="v21-help-body">
              <Show when={book.meta.receivedNote}><p class="v21-notice v21-small" style={{ 'grid-column': '1 / -1', margin: 0 }}>{book.meta.receivedNote}</p></Show>
              <For each={book.prefixes.filter((p) => p.status !== 'missing')}>
                {(p) => (
                  <section class="v21-help-section">
                    <h3>
                      {p.label} <code>{p.prefix}</code> {shownCount(p.group)}/{bookTags(book, p.group).length}
                      <span class="v21-tag-editor-bulk">
                        <button type="button" class="v21-link" onClick={() => setTagsShown(book.meta.id, bookTags(book, p.group).map((t) => t.id), true)}>全部出す</button>
                        <button type="button" class="v21-link" onClick={() => setTagsShown(book.meta.id, bookTags(book, p.group).map((t) => t.id), false)}>全部隠す</button>
                      </span>
                    </h3>
                    <ul>
                      <For each={bookTags(book, p.group)}>
                        {(t) => (
                          <li>
                            <label class="v21-tag-check">
                              <input type="checkbox" checked={isTagShown(book.meta.id, t.id)} onChange={(e) => setTagsShown(book.meta.id, [t.id], e.currentTarget.checked)} />
                              <code>{t.id}</code>
                              <span>{t.label}</span>
                            </label>
                          </li>
                        )}
                      </For>
                    </ul>
                  </section>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </>
  )
}

export default TagPicker
