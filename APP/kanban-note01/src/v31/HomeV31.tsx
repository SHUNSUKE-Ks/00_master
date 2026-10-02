import { type Component, For, Show, createSignal } from 'solid-js'
import { parseTable, tablePlain } from './table'
import { createNote, db, deleteNote, noteById, notebookById, noteTitle, openNote, updateNote, type Note } from './store'
import { hostOf, parseLink, resolveRefs } from './links'
import Bookshelf from './Bookshelf'

// ホーム（ノート一覧）。Google Keep のようなカード。ピン留め → 最近の順。
// 探す時は、本文の一致した箇所を前後ごと見せる（見返すのが苦手でも、覚えている言葉から戻れるように）。

const ago = (iso: string) => {
  const m = (Date.now() - Date.parse(iso)) / 60000
  if (m < 1) return 'いま'
  if (m < 60) return `${Math.floor(m)}分前`
  if (m < 1440) return `${Math.floor(m / 60)}時間前`
  if (m < 1440 * 7) return `${Math.floor(m / 1440)}日前`
  return iso.slice(0, 10)
}
// 表・リンクのカード・アプリ内リンクは、読める文字にしてから見せる
const plain = (body: string) => resolveRefs(
  body.split('\n').map((l) => { const t = parseTable(l); const c = parseLink(l); return t ? tablePlain(t) : c ? `🔗 ${c.t || hostOf(c.u)}` : l }).join('\n'),
  (id) => { const p = noteById(id); return p ? noteTitle(p) : null },
).replace(/^#{1,4}\s+/gm, '')

/** 一致した箇所の前後を切り出す */
function snippet(n: Note, q: string) {
  const text = plain(n.body).replace(/\n+/g, ' ')
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return { before: text.slice(0, 80), hit: '', after: '' }
  const s = Math.max(0, i - 30)
  return { before: (s ? '…' : '') + text.slice(s, i), hit: text.slice(i, i + q.length), after: text.slice(i + q.length, i + q.length + 50) + '…' }
}

const Card: Component<{ n: Note; q: string; i?: number }> = (props) => {
  const [sure, setSure] = createSignal(false)
  const s = () => snippet(props.n, props.q)
  return (
    <li class="bn-card" classList={{ pinned: !!props.n.pinned }} style={{ '--i': String(Math.min(props.i ?? 0, 12)) }}>
      <button type="button" class="bn-card-open" onClick={() => openNote(props.n.id)}>
        <h3>{noteTitle(props.n)}</h3>
        <p>
          <Show when={props.q} fallback={plain(props.n.body).slice(0, 120)}>
            {s().before}<mark>{s().hit}</mark>{s().after}
          </Show>
        </p>
        <small>{ago(props.n.updatedAt)}</small>
      </button>
      <div class="bn-card-tools">
        <button type="button" class="bn-mini" aria-pressed={!!props.n.pinned} onClick={() => updateNote(props.n.id, { pinned: !props.n.pinned })} title={props.n.pinned ? 'ピン留めを外す' : 'ピン留め（いつも上に出す）'} aria-label={`${noteTitle(props.n)} をピン留め`}>
          {props.n.pinned ? '★' : '☆'}
        </button>
        <Show
          when={sure()}
          fallback={<button type="button" class="bn-mini" onClick={() => setSure(true)} title="消す" aria-label={`${noteTitle(props.n)} を消す`}>×</button>}
        >
          <button type="button" class="bn-mini danger" onClick={() => deleteNote(props.n.id)}>消す</button>
          <button type="button" class="bn-mini" onClick={() => setSure(false)}>やめる</button>
        </Show>
      </div>
    </li>
  )
}

/** 見出し（UpNote のように ∨ で畳める・件数つき） */
const SectionHead: Component<{ label: string; count: number; open: boolean; onToggle: () => void }> = (props) => (
  <h2 class="bn-home-h">
    <button type="button" aria-expanded={props.open} onClick={props.onToggle}>
      <svg viewBox="0 0 24 24" aria-hidden="true" classList={{ shut: !props.open }}><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
      {props.label}<span class="bn-home-count">{props.count}</span>
    </button>
  </h2>
)

const HomeV31: Component<{ query: string; setQuery: (q: string) => void }> = (props) => {
  const [openPinned, setOpenPinned] = createSignal(true)
  const [openRecent, setOpenRecent] = createSignal(true)
  const q = () => props.query.trim()
  const sorted = () => [...db.pages].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  const hits = () => sorted().filter((n) => (n.title + '\n' + n.body).toLowerCase().includes(q().toLowerCase()))
  const book = () => notebookById(db.shelfBook)
  // 本を選んでいる時は、その本のページだけ（本棚の下がそのまま切り替わる）
  const scoped = () => (book() ? sorted().filter((n) => n.notebookId === book()!.id) : sorted())
  const pinned = () => scoped().filter((n) => n.pinned)
  const rest = () => scoped().filter((n) => !n.pinned)

  return (
    <div class="bn-home">
      <Bookshelf />
      <Show
        when={!q()}
        fallback={
          <section aria-live="polite">
            <div class="bn-home-head">
              <h2>「{q()}」を含むページ {hits().length}件</h2>
              <button type="button" class="v21-btn" onClick={() => props.setQuery('')}>探すのをやめる</button>
            </div>
            <ul class="bn-cards"><For each={hits()} fallback={<li class="bn-lead">見つかりません。別の言葉でも試してください。</li>}>{(n, i) => <Card n={n} q={q()} i={i()} />}</For></ul>
          </section>
        }
      >
        <Show when={db.pages.length} fallback={
          <div class="bn-empty">
            <p>まだページがありません。</p>
            <button type="button" class="v21-btn primary" onClick={() => createNote()}>＋ まず書く</button>
          </div>
        }>
          <Show when={pinned().length}>
            <section>
              <SectionHead label="ピン留め" count={pinned().length} open={openPinned()} onToggle={() => setOpenPinned(!openPinned())} />
              <Show when={openPinned()}>
                <ul class="bn-cards"><For each={pinned()}>{(n, i) => <Card n={n} q="" i={i()} />}</For></ul>
              </Show>
            </section>
          </Show>
          <section>
            <SectionHead label={book() ? `『${book()!.title}』のページ` : '最近のページ'} count={rest().length} open={openRecent()} onToggle={() => setOpenRecent(!openRecent())} />
            <Show when={openRecent()}>
            <ul class="bn-cards">
              <li class="bn-card new">
                <button type="button" class="bn-card-open" onClick={() => createNote()}>
                  <h3>＋ 新しいページ</h3>
                  <p>{book() ? `『${book()!.title}』に入ります。` : '分類は後からでよい。まず書く。'}</p>
                </button>
              </li>
              <For each={rest()}>{(n, i) => <Card n={n} q="" i={i() + 1} />}</For>
            </ul>
            </Show>
          </section>
        </Show>
      </Show>
    </div>
  )
}

export default HomeV31
