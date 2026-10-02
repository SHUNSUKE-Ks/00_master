import { type Component, For, Show, createEffect, createMemo, createSignal } from 'solid-js'
import { state } from '../store'
import type { Notebook } from '../types'
import { WW_KINDS, createEvent, createTitle } from './actions'
import { MEMO_SHELF, addMemo } from './drafts'
import ChangeLogPanel from './ChangeLogPanel'
import { ArchiveList, EditBar, EditToggle, MoveButtons, TrashList, createSelection } from './ListTools'
import { moveInList } from './actions'
import { byListOrder, coverGradient, go, isArchivedNotebook, isEventNotebook, isTitleNotebook, isTrashedNotebook, namedCast, scenePages, titleSynopsis, updatedTime } from './nav'

// Title 一覧（2026-09-28 作り直し）。Title＋サムネ＋Dict の行と、その下の三角の開閉リスト（資料）。
// 資料 = 物語を組み立てるのに要るもの（その Title の Event・登場人物・Scene・WW（アイテム・武器・スキル・用語））を Title からまとめて見る。
// 開閉の動きは UI カタログの expand-term-inline（DesignLab）に合わせた: 高さを 0fr→1fr で開く・aria-expanded・動きを減らす設定では止める。
// 今後: Title ごとに Library から要る物だけ足す／初期の世界観を default の Template から選んで始める（docs の構想メモ）。
// 見出しの下に「最新の変更ログ」（最近の変更・届いた納品・外から届いたシナリオ）。
// 見出しの「編集」で 選ぶ・並べ替え（↑↓）・非表示・ごみ箱へ（ふだんは場所を取らない）。非表示は「非表示 n」から見て戻せる。

const OPEN_KEY = 'note-story-v21-title-open'
function readOpen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(OPEN_KEY) || '[]') as string[]) } catch { return new Set() }
}

function startMemo() {
  const m = addMemo()
  go({ name: 'desk', shelf: MEMO_SHELF, draftId: m.id })
}

const TitleMaterials: Component<{ nb: Notebook }> = (props) => {
  const events = () => state.notebooks.filter((n) => isEventNotebook(n) && n.titleIds?.includes(props.nb.id!)).sort((a, b) => updatedTime(b) - updatedTime(a))
  const cast = () => namedCast(props.nb)
  const scenes = () => scenePages(props.nb)
  const ww = (kind: string) => (props.nb.ww ?? []).filter((e) => e.kind === kind)
  return (
    <div class="v21-mat">
      <section>
        <h4>Event<small>{events().length}</small></h4>
        <div class="v21-mat-chips">
          <For each={events()}>
            {(ev) => <button type="button" onClick={() => go({ name: 'title', notebookId: ev.id! })}>{ev.title || '無題'}</button>}
          </For>
          <button type="button" class="add" onClick={() => void createEvent({ titleId: props.nb.id })}>＋ イベント</button>
        </div>
      </section>
      <section>
        <h4>登場人物<small>{cast().length}</small></h4>
        <Show when={cast().length} fallback={<p class="v21-mat-none">まだいません（作品ページで名前を入れる）</p>}>
          <div class="v21-mat-chips">
            <For each={cast()}>
              {(c) => (
                <button type="button" title={c.role || c.name} onClick={() => go({ name: 'title', notebookId: props.nb.id! })}>
                  <Show when={c.portrait}><img src={c.portrait!} alt="" loading="lazy" style={{ 'object-position': `${c.focusX ?? '50%'} ${c.focusY ?? '15%'}` }} /></Show>
                  {c.name}
                </button>
              )}
            </For>
          </div>
        </Show>
      </section>
      <section>
        <h4>Scene<small>{scenes().length}</small></h4>
        <Show when={scenes().length} fallback={<p class="v21-mat-none">場面がありません</p>}>
          <div class="v21-mat-chips">
            <For each={scenes()}>{(p) => <button type="button" onClick={() => go({ name: 'talk', notebookId: props.nb.id!, pageId: p.id })}>{p.title || '無題'}</button>}</For>
          </div>
        </Show>
      </section>
      <For each={WW_KINDS}>
        {(k) => (
          <section>
            <h4>{k.label}<small>{ww(k.id).length}</small></h4>
            <Show when={ww(k.id).length} fallback={<p class="v21-mat-none">まだありません（会話ログ・執筆デスクの WW で足す）</p>}>
              <div class="v21-mat-chips">
                <For each={ww(k.id)}>{(e) => <span class="v21-mat-ww" title={e.dict ?? ''}>{e.name}<Show when={e.dict}><small>{e.dict}</small></Show></span>}</For>
              </div>
            </Show>
          </section>
        )}
      </For>
      <p class="v21-mat-later">Library から要る物だけ足す・世界観を Template から始める（準備中）</p>
    </div>
  )
}

const TitlesV21: Component = () => {
  const [query, setQuery] = createSignal('')
  const [open, setOpen] = createSignal<Set<string>>(readOpen())
  const [showTrash, setShowTrash] = createSignal(false)
  const [showArchive, setShowArchive] = createSignal(false)
  const sel = createSelection()
  const titles = createMemo(() => {
    const q = query().trim().toLowerCase()
    return state.notebooks
      .filter(isTitleNotebook)
      .filter((nb) => !q || `${nb.title} ${titleSynopsis(nb)}`.toLowerCase().includes(q))
      .sort(byListOrder)
  })
  const trashed = createMemo(() => state.notebooks.filter((n) => isTrashedNotebook(n) && n.kind !== 'event'))
  const archived = createMemo(() => state.notebooks.filter((n) => isArchivedNotebook(n) && n.kind !== 'event').sort((a, b) => updatedTime(b) - updatedTime(a)))
  createEffect(() => { if (!archived().length) setShowArchive(false) })
  /** 並べ替えは、絞り込んでいないときだけ（全部の並びが見えているとき） */
  const move = (id: string, step: number) => moveInList(titles().map((t) => t.id!), id, step)
  // ごみ箱が空になったら閉じる（次に入れたとき、勝手に開かないように）
  createEffect(() => { if (!trashed().length) setShowTrash(false) })
  const eventCount = (id: string) => state.notebooks.filter((n) => isEventNotebook(n) && n.titleIds?.includes(id)).length
  const wwCount = (nb: Notebook) => (nb.ww ?? []).length

  function toggleOpen(id: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem(OPEN_KEY, JSON.stringify([...next])) } catch { /* 無視 */ }
      return next
    })
  }
  function onRow(nb: Notebook) {
    if (sel.active()) sel.toggle(nb.id!)
    else go({ name: 'title', notebookId: nb.id! })
  }

  return (
    <div class="v21-page" classList={{ 'is-selecting': sel.active() }}>
      <div class="v21-page-head">
        <div>
          <p class="v21-kicker">TITLES</p>
          <h1>タイトル</h1>
        </div>
        <input class="v21-search" placeholder="タイトル・Dict を検索" value={query()} onInput={(e) => setQuery(e.currentTarget.value)} />
        <div class="v21-head-actions">
          <button type="button" class="v21-btn primary" onClick={createTitle}>＋ 新しいタイトル</button>
          <button type="button" class="v21-btn" onClick={startMemo} title="どの Title にも属さないメモを書く">＋ 新しいメモ</button>
          <span class="v21-head-quiet">
            <Show when={titles().length}><EditToggle sel={sel} /></Show>
            <Show when={archived().length}>
              <button type="button" class="v21-link" onClick={() => setShowArchive(!showArchive())}>非表示 {archived().length}</button>
            </Show>
            <Show when={trashed().length}>
              <button type="button" class="v21-link" onClick={() => setShowTrash(!showTrash())}>ごみ箱 {trashed().length}</button>
            </Show>
          </span>
        </div>
      </div>

      {/* 最新の変更ログ（前の「届いた納品」。見出しの下） */}
      <div class="v21-titles-changelog"><ChangeLogPanel /></div>

      <Show when={showArchive() && archived().length}>
        <ArchiveList items={archived()} noun="タイトル" onClose={() => setShowArchive(false)} />
      </Show>

      <Show when={showTrash() && trashed().length}>
        <TrashList items={trashed()} noun="タイトル" onClose={() => setShowTrash(false)} />
      </Show>

      <Show when={titles().length} fallback={<p class="v21-empty">{query() ? '見つかりません。' : 'まだタイトルがありません。右上から作れます。'}</p>}>
        <div class="v21-tlist">
          <For each={titles()}>
            {(nb, i) => {
              const isOpen = () => open().has(nb.id!)
              const panelId = `v21-mat-${nb.id}`
              return (
                <article class="v21-trow" classList={{ selected: sel.has(nb.id!), open: isOpen() }}>
                  <div class="v21-trow-main" role="button" tabIndex={0} aria-label={sel.active() ? `${nb.title || '無題'} を選ぶ` : `${nb.title || '無題'} を開く`}
                    aria-selected={sel.active() ? sel.has(nb.id!) : undefined}
                    onClick={() => onRow(nb)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRow(nb) } }}>
                    <Show when={sel.active()}><span class="v21-check" aria-hidden="true">{sel.has(nb.id!) ? '✓' : ''}</span></Show>
                    <div class="v21-trow-cover" style={nb.cover ? { 'background-image': `url(${nb.cover})` } : { background: coverGradient(nb.title) }}>
                      <Show when={!nb.cover}><span>{[...nb.title][0]}</span></Show>
                    </div>
                    <div class="v21-trow-body">
                      <h3>{nb.title || '無題'}</h3>
                      <p>{titleSynopsis(nb) || 'Dict 未設定'}</p>
                    </div>
                    <Show when={sel.active()}>
                      <MoveButtons index={i()} total={titles().length} label={nb.title || '無題'} disabled={!!query().trim()} onMove={(step) => move(nb.id!, step)} />
                    </Show>
                  </div>
                  <button
                    type="button"
                    class="v21-disclosure"
                    aria-expanded={isOpen()}
                    aria-controls={panelId}
                    disabled={sel.active()}
                    onClick={() => toggleOpen(nb.id!)}
                  >
                    <span class="v21-tri" aria-hidden="true">▶</span>
                    資料
                    <small>Event {eventCount(nb.id!)} ・ 人物 {namedCast(nb).length} ・ Scene {scenePages(nb).length} ・ WW {wwCount(nb)}</small>
                  </button>
                  <div class="v21-disclosure-panel" classList={{ 'is-open': isOpen() }} id={panelId} role="region" aria-label={`${nb.title || "無題"} の資料`} aria-hidden={!isOpen()} inert={!isOpen()}>
                    <div class="v21-disclosure-inner">
                      <TitleMaterials nb={nb} />
                    </div>
                  </div>
                </article>
              )
            }}
          </For>
        </div>
      </Show>

      <EditBar sel={sel} noun="タイトル" note="付いているイベントはそのまま残ります（Title タグに「ごみ箱」と出ます）。" />
    </div>
  )
}

export default TitlesV21
