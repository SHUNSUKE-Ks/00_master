import { type Component, For, Show, createEffect, createMemo, createSignal } from 'solid-js'
import { state } from '../store'
import type { Notebook } from '../types'
import { createEvent } from './actions'
import { MEMO_SHELF, addDraft, addMemo, draftsOf } from './drafts'
import { ArchiveList, EditBar, EditToggle, MoveButtons, TrashList, createSelection } from './ListTools'
import { moveInList } from './actions'
import { byListOrder, coverGradient, go, isArchivedNotebook, isEventNotebook, isTitleNotebook, isTrashedNotebook, namedCast, scenePages, titleSynopsis, titleTalkCount, updatedTime } from './nav'

// イベント一覧（2026-09-28 利用者）。前のタイトル一覧の並べ方（サムネ＋名前＋Dict＋下書き）を、イベントに使う。
// カードには Title タグと Character タグ。数が増えたら下へ列が増える。届いた納品はここには出さない（Title の画面）。
// 「新しいメモ」は、どの Title にも属さないメモ。見出しの「編集」で 選ぶ・並べ替え・非表示・ごみ箱へ（ふだんは場所を取らない）。

function startDraft(notebookId: string) {
  const d = addDraft(notebookId)
  go({ name: 'desk', shelf: notebookId, draftId: d.id })
}
function startMemo() {
  const m = addMemo()
  go({ name: 'desk', shelf: MEMO_SHELF, draftId: m.id })
}

/** Character タグ "<TitleのID>:<枠ID>" の名前 */
export function characterRefName(ref: string) {
  const [titleId, slotId] = ref.split(':')
  return state.notebooks.find((n) => n.id === titleId)?.cast?.find((c) => c.id === slotId)?.name ?? '（消えた人物）'
}
export const titleNameOf = (id: string) => {
  const nb = state.notebooks.find((n) => n.id === id)
  return nb ? `${nb.title || '無題'}${nb.trashedAt ? '（ごみ箱）' : nb.archivedAt ? '（非表示）' : ''}` : '（消えた Title）'
}

export const EventTags: Component<{ nb: Notebook }> = (props) => (
  <Show when={props.nb.titleIds?.length || props.nb.characterRefs?.length}>
    <div class="v21-event-tags">
      <For each={props.nb.titleIds ?? []}>{(id) => <span class="v21-tag-title" title="Title タグ">{titleNameOf(id)}</span>}</For>
      <For each={props.nb.characterRefs ?? []}>{(ref) => <span class="v21-tag-char" title="Character タグ">{characterRefName(ref)}</span>}</For>
    </div>
  </Show>
)

const EventsV21: Component = () => {
  const [query, setQuery] = createSignal('')
  const [titleFilter, setTitleFilter] = createSignal('')
  const [showTrash, setShowTrash] = createSignal(false)
  const [showArchive, setShowArchive] = createSignal(false)
  const sel = createSelection()
  const titles = createMemo(() => state.notebooks.filter(isTitleNotebook))
  const events = createMemo(() => {
    const q = query().trim().toLowerCase()
    const t = titleFilter()
    return state.notebooks
      .filter(isEventNotebook)
      .filter((nb) => !t || (t === '__none__' ? !(nb.titleIds?.length) : nb.titleIds?.includes(t)))
      .filter((nb) => !q || `${nb.title} ${titleSynopsis(nb)} ${(nb.characterRefs ?? []).map(characterRefName).join(' ')}`.toLowerCase().includes(q))
      .sort(byListOrder)
  })
  const trashed = createMemo(() => state.notebooks.filter((n) => isTrashedNotebook(n) && n.kind === 'event'))
  const archived = createMemo(() => state.notebooks.filter((n) => isArchivedNotebook(n) && n.kind === 'event').sort((a, b) => updatedTime(b) - updatedTime(a)))
  createEffect(() => { if (!archived().length) setShowArchive(false) })
  const filtered = () => !!query().trim() || !!titleFilter()
  const move = (id: string, step: number) => moveInList(events().map((e) => e.id!), id, step)
  // ごみ箱が空になったら閉じる（次に入れたとき、勝手に開かないように）
  createEffect(() => { if (!trashed().length) setShowTrash(false) })

  function onCard(nb: Notebook) {
    if (sel.active()) sel.toggle(nb.id!)
    else go({ name: 'title', notebookId: nb.id! })
  }

  return (
    <div class="v21-page" classList={{ 'is-selecting': sel.active() }}>
      <div class="v21-page-head">
        <div>
          <p class="v21-kicker">EVENTS</p>
          <h1>イベント</h1>
        </div>
        <input class="v21-search" placeholder="イベント・Dict・登場人物を検索" value={query()} onInput={(e) => setQuery(e.currentTarget.value)} />
        <Show when={titles().length}>
          <select class="v21-head-select" value={titleFilter()} aria-label="Title で絞る" onChange={(e) => setTitleFilter(e.currentTarget.value)}>
            <option value="">すべての Title</option>
            <For each={titles()}>{(t) => <option value={t.id}>{t.title || '無題'}</option>}</For>
            <option value="__none__">Title なし</option>
          </select>
        </Show>
        <div class="v21-head-actions">
          <button type="button" class="v21-btn primary" onClick={() => void createEvent({ titleId: titleFilter() && titleFilter() !== '__none__' ? titleFilter() : undefined })}>＋ 新しいイベント</button>
          <button type="button" class="v21-btn" onClick={startMemo} title="どの Title にも属さないメモを書く">＋ 新しいメモ</button>
          <span class="v21-head-quiet">
            <Show when={events().length}><EditToggle sel={sel} /></Show>
            <Show when={archived().length}>
              <button type="button" class="v21-link" onClick={() => setShowArchive(!showArchive())}>非表示 {archived().length}</button>
            </Show>
            <Show when={trashed().length}>
              <button type="button" class="v21-link" onClick={() => setShowTrash(!showTrash())}>ごみ箱 {trashed().length}</button>
            </Show>
          </span>
        </div>
      </div>

      <Show when={showArchive() && archived().length}>
        <ArchiveList items={archived()} noun="イベント" onClose={() => setShowArchive(false)} />
      </Show>
      <Show when={showTrash() && trashed().length}>
        <TrashList items={trashed()} noun="イベント" onClose={() => setShowTrash(false)} />
      </Show>

      <Show
        when={events().length}
        fallback={
          <div class="v21-empty-invite">
            <p>{query() || titleFilter() ? '見つかりません。' : 'まだイベントがありません。'}</p>
            <Show when={!query()}>
              <p class="v21-dim v21-small">イベントは、場面・登場人物・下書き・プロットを持つ出来事のまとまりです。Title と登場人物のタグで、どの Title の誰の話かを付けます。</p>
              <button type="button" class="v21-btn primary" onClick={() => void createEvent({ titleId: titleFilter() && titleFilter() !== '__none__' ? titleFilter() : undefined })}>＋ 最初のイベントを作る</button>
            </Show>
          </div>
        }
      >
        <div class="v21-title-grid v21-event-grid">
          <For each={events()}>
            {(nb, i) => (
              <article class="v21-title-card v21-event-card" classList={{ selected: sel.has(nb.id!) }} onClick={() => onCard(nb)} aria-selected={sel.active() ? sel.has(nb.id!) : undefined}>
                <Show when={sel.active()}><span class="v21-check" aria-hidden="true">{sel.has(nb.id!) ? '✓' : ''}</span></Show>
                <button type="button" class="v21-title-open" aria-label={sel.active() ? `${nb.title || '無題'} を選ぶ` : `${nb.title || '無題'} を開く`}>
                  <div class="v21-title-cover" style={nb.cover ? { 'background-image': `url(${nb.cover})` } : { background: coverGradient(nb.title) }}>
                    <Show when={!nb.cover}><span>{[...nb.title][0]}</span></Show>
                  </div>
                  <div class="v21-title-body">
                    <h3>{nb.title || '無題'}</h3>
                    <p>{titleSynopsis(nb) || 'Dict 未設定'}</p>
                    <EventTags nb={nb} />
                    <div class="v21-title-meta">
                      <span>{scenePages(nb).length}場面</span>
                      <span>会話 {titleTalkCount(nb)}</span>
                      <span>{namedCast(nb).length}人</span>
                    </div>
                  </div>
                </button>
                <Show when={sel.active()}>
                  <div class="v21-title-actions"><MoveButtons index={i()} total={events().length} label={nb.title || '無題'} disabled={filtered()} onMove={(step) => move(nb.id!, step)} /></div>
                </Show>
                <Show when={!sel.active()}>
                  <div class="v21-title-actions">
                    <button
                      type="button"
                      class="v21-btn v21-title-draft"
                      title="このイベントの新しい下書きを開いて、すぐ書き始める"
                      onClick={(e) => { e.stopPropagation(); startDraft(nb.id!) }}
                    >
                      ✎ 下書き
                    </button>
                    <Show when={draftsOf(nb.id!).length}>
                      <span class="v21-dim">下書き {draftsOf(nb.id!).length}</span>
                    </Show>
                  </div>
                </Show>
              </article>
            )}
          </For>
        </div>
      </Show>

      <EditBar sel={sel} noun="イベント" note="イベントの下書きもそのまま残ります。" />
    </div>
  )
}

export default EventsV21
