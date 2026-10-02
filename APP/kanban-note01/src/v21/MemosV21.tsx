import { type Component, For, Show, createMemo, createSignal } from 'solid-js'
import {
  MEMO_GRACE_DAYS, MEMO_STATUS, MEMO_SHELF, addMemo, liveMemos, memoDaysLeft, memoStatusLabel, restoreMemo,
  sweepMemos, trashedMemos, type Draft, type MemoStatus,
} from './drafts'
import { go } from './nav'

// アイディアメモ（どの作品にも属さないメモ）の一覧。Google Keep 風に、長さの違うカードを段組みで並べる。
// カードの形は成分表（NACC_System/nacc_database.html の .gallery / .card）の GalleryCard 式:
//   名前 → 金色の小見出し（進捗）→ 本文の頭 → タグ（柱・#タグ）。
// 作ってから10日のうちに進捗を変えないメモは、ごみ箱へ移す（完全には消さない。ごみ箱から戻せる）。

type Filter = 'all' | MemoStatus | 'trash'

const TAG_IN_BODY = /(?:^|\s)#([^\s#]{1,24})/g
const PILLAR_LINE = /^柱[：:]\s*(.+)$/

function cardTags(m: Draft) {
  const out: string[] = []
  for (const line of m.body.split('\n')) {
    const p = line.match(PILLAR_LINE)
    if (p) out.push(`柱 ${p[1].trim()}`)
  }
  for (const t of m.body.matchAll(TAG_IN_BODY)) out.push(`#${t[1]}`)
  return [...new Set(out)].slice(0, 4)
}

const MemosV21: Component = () => {
  const moved = sweepMemos()
  const [filter, setFilter] = createSignal<Filter>('all')
  const [query, setQuery] = createSignal('')

  const list = createMemo(() => {
    const f = filter()
    const q = query().trim().toLowerCase()
    const pool = f === 'trash' ? trashedMemos() : liveMemos().filter((m) => f === 'all' || (m.status ?? 'seed') === f)
    return pool
      .filter((m) => !q || `${m.title} ${m.body}`.toLowerCase().includes(q))
      .sort((a, b) => Date.parse(f === 'trash' ? b.trashedAt! : b.updatedAt) - Date.parse(f === 'trash' ? a.trashedAt! : a.updatedAt))
  })
  const count = (f: Filter) => (f === 'trash' ? trashedMemos().length : f === 'all' ? liveMemos().length : liveMemos().filter((m) => (m.status ?? 'seed') === f).length)

  function newMemo() {
    const m = addMemo()
    go({ name: 'desk', shelf: MEMO_SHELF, draftId: m.id })
  }
  const open = (m: Draft) => go({ name: 'desk', shelf: MEMO_SHELF, draftId: m.id })

  return (
    <div class="v21-page">
      <div class="v21-page-head">
        <div>
          <p class="v21-kicker">IDEA MEMO</p>
          <h1>アイディアメモ</h1>
        </div>
        <input class="v21-search" placeholder="メモを検索" value={query()} onInput={(e) => setQuery(e.currentTarget.value)} />
        <div class="v21-head-actions">
          <button type="button" class="v21-btn primary" onClick={newMemo}>＋ 新しいメモ</button>
        </div>
      </div>

      <div class="v21-memo-filters" role="tablist" aria-label="進捗で絞る">
        <For each={[{ id: 'all' as Filter, label: 'すべて' }, ...MEMO_STATUS.map((s) => ({ id: s.id as Filter, label: s.label })), { id: 'trash' as Filter, label: 'ごみ箱' }]}>
          {(f) => (
            <button type="button" role="tab" classList={{ on: filter() === f.id, trash: f.id === 'trash' }} onClick={() => setFilter(f.id)}>
              {f.label}<span>{count(f.id)}</span>
            </button>
          )}
        </For>
      </div>

      <p class="v21-memo-rule">
        作ってから{MEMO_GRACE_DAYS}日のうちに進捗（種・育てる・使う・寝かせる）を変えないメモは、ごみ箱へ移ります。ごみ箱からは戻せます（完全には消しません）。
        <Show when={moved}><b> いま{moved}件をごみ箱へ移しました。</b></Show>
      </p>

      <Show
        when={list().length}
        fallback={
          <p class="v21-empty">
            {filter() === 'trash' ? 'ごみ箱は空です。' : query() ? '見つかりません。' : 'まだメモがありません。右上の「＋ 新しいメモ」から書けます。'}
          </p>
        }
      >
        <div class="v21-memo-grid">
          <For each={list()}>
            {(m) => {
              const left = () => memoDaysLeft(m)
              return (
                <article
                  class={`v21-memo-card st-${m.status ?? 'seed'}`}
                  classList={{ trashed: !!m.trashedAt, due: !m.trashedAt && left() !== null && left()! <= 3 }}
                  onClick={() => !m.trashedAt && open(m)}
                >
                  <div class="v21-memo-body">
                    <Show when={m.title.trim()}><h3 class="v21-memo-name">{m.title}</h3></Show>
                    <p class="v21-memo-dict">{memoStatusLabel(m.status)}</p>
                    <Show when={m.body.trim()} fallback={<p class="v21-memo-text v21-dim">（本文なし）</p>}>
                      <p class="v21-memo-text">{m.body.trim().slice(0, 400)}</p>
                    </Show>
                    <Show when={cardTags(m).length}>
                      <div class="v21-memo-tags"><For each={cardTags(m)}>{(t) => <span>{t}</span>}</For></div>
                    </Show>
                    <Show when={m.trashedAt} fallback={
                      <Show when={left() !== null}><p class="v21-memo-due">あと{left()}日でごみ箱へ</p></Show>
                    }>
                      <div class="v21-memo-trash">
                        <span>{m.trashReason === 'expired' ? '期限でごみ箱へ' : '自分でごみ箱へ'}</span>
                        <button type="button" class="v21-btn" onClick={(e) => { e.stopPropagation(); restoreMemo(m.id) }}>元に戻す</button>
                      </div>
                    </Show>
                  </div>
                </article>
              )
            }}
          </For>
        </div>
      </Show>
    </div>
  )
}

export default MemosV21
