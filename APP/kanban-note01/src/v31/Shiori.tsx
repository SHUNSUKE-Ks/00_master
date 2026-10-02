import { type Component, For, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { parseLines } from './exportNote'
import { parseTable } from './table'
import { addBookmark, db, noteById, notebookById, noteTitle, removeBookmark, setBookmarkMemo, type Bookmark } from './store'

// しおり（2026-10-02 利用者）。ゲームのセーブ＆ロードのように、書いていた場所を挟んでおき、すぐ続きから始める。
// 本（タイトル）に関わらず、全部のしおりを新しい順に並べる。ヘッダーの「新しいページ」の隣のリボンから開く。

const ago = (iso: string) => {
  const m = (Date.now() - Date.parse(iso)) / 60000
  if (m < 1) return 'いま'
  if (m < 60) return `${Math.floor(m)}分前`
  if (m < 1440) return `${Math.floor(m / 60)}時間前`
  if (m < 1440 * 7) return `${Math.floor(m / 1440)}日前`
  return iso.slice(0, 10).replace(/-/g, '/')
}
const when = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** いまの場所でしおりを作る（見出しと、その行の文字も控える） */
export function saveBookmark(pageId: string, pos: { line: number; offset: number; scroll: number }): Bookmark | null {
  const page = noteById(pageId)
  if (!page) return null
  const lines = parseLines(page.body)
  let heading = ''
  for (let i = Math.min(pos.line, lines.length - 1); i >= 0; i--) if (lines[i].level) { heading = `H${lines[i].level} ${lines[i].text}`; break }
  // カーソルの行が空なら、上の文字のある行を見せる
  let snippet = ''
  for (let i = Math.min(pos.line, lines.length - 1); i >= 0 && !snippet; i--) {
    const t = lines[i]
    snippet = parseTable(t.text) ? '（表）' : t.text.replace(/!\[[^\]]*\]\(bnimg:[^)]*\)/g, '［写真］').trim()
  }
  return addBookmark({ pageId, ...pos, heading, snippet: snippet.slice(0, 80) })
}

/** ヘッダーのしおりボタン（本に挟むリボンの形） */
export const ShioriButton: Component<{ onClick: () => void; compact?: boolean }> = (props) => (
  <button type="button" class="bn-shiori-btn" classList={{ compact: props.compact }} onClick={props.onClick} title="しおり（挟んだ所から続きを書く）" aria-label={`しおり ${db.bookmarks.length}件`}>
    <span class="bn-shiori-ribbon" aria-hidden="true"><span>栞</span></span>
    <Show when={!props.compact}><span class="bn-shiori-label">しおり</span></Show>
    <Show when={db.bookmarks.length}><small class="bn-count">{db.bookmarks.length}</small></Show>
  </button>
)

type ScreenProps = {
  /** いま書いているページ（無ければ挟めない） */
  pageId: string | null
  getPos: () => { line: number; offset: number; scroll: number } | null
  onLoad: (b: Bookmark) => void
  onClose: () => void
  onToast: (t: string) => void
}

/** しおりの画面（セーブ＆ロードの一覧） */
export const ShioriScreen: Component<ScreenProps> = (props) => {
  const [sure, setSure] = createSignal<string | null>(null)
  const page = () => noteById(props.pageId)
  function save() {
    const pos = props.getPos()
    if (!props.pageId || !pos) return
    const b = saveBookmark(props.pageId, pos)
    if (b) props.onToast(`しおりを挟みました：${noteTitle(page()!)}`)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); props.onClose(); return }
    // 1〜9 で、その番号のしおりから始める（ゲームのロードのように）
    if (/^[1-9]$/.test(e.key) && !e.altKey && !e.ctrlKey && !(e.target as Element | null)?.closest?.('input, textarea, select')) {
      const b = db.bookmarks[Number(e.key) - 1]
      if (b) { e.preventDefault(); props.onLoad(b) }
    }
  }
  onMount(() => window.addEventListener('keydown', onKey, true))
  onCleanup(() => window.removeEventListener('keydown', onKey, true))

  return (
    <div class="bn-shiori-back" onClick={(e) => e.target === e.currentTarget && props.onClose()}>
      <section class="bn-shiori" role="dialog" aria-modal="true" aria-labelledby="bn-shiori-title">
        <header class="bn-shiori-head">
          <span class="bn-shiori-ribbon big" aria-hidden="true"><span>栞</span></span>
          <div>
            <h2 id="bn-shiori-title">しおり</h2>
            <p>挟んだ所から、すぐに続きを書けます（数字キー 1〜9 でも開けます）</p>
          </div>
          <button type="button" class="bn-shiori-close" onClick={props.onClose} aria-label="閉じる">×</button>
        </header>

        <button type="button" class="bn-shiori-save" disabled={!page()} onClick={save}>
          <span class="bn-shiori-plus" aria-hidden="true">＋</span>
          <span>
            <b>いまの場所にしおりを挟む</b>
            <small>{page() ? `「${noteTitle(page()!)}」のカーソルの位置（Alt+B でも）` : 'ページを開いている時に挟めます'}</small>
          </span>
        </button>

        <ol class="bn-shiori-list">
          <For each={db.bookmarks} fallback={<li class="bn-shiori-empty">まだしおりがありません。書いている途中で挟んでおくと、次はここからすぐ始められます。</li>}>
            {(b, i) => {
              const pg = () => noteById(b.pageId)
              const book = () => notebookById(pg()?.notebookId)
              return (
                <li class="bn-slot" style={{ '--i': String(Math.min(i(), 12)) }}>
                  <button type="button" class="bn-slot-cover" style={{ '--hue': String(book()?.hue ?? 210) }} onClick={() => props.onLoad(b)} aria-label={`${pg() ? noteTitle(pg()!) : ''} の続きから`}>
                    <span>{book()?.cover ?? '頁'}</span>
                    <small>No.{String(i() + 1).padStart(2, '0')}</small>
                  </button>
                  <div class="bn-slot-main">
                    <div class="bn-slot-top">
                      <h3>{pg() ? noteTitle(pg()!) : '（消えたページ）'}</h3>
                      <span class="bn-slot-when" title={when(b.createdAt)}>{ago(b.createdAt)}</span>
                    </div>
                    <div class="bn-slot-row"><span class="bn-bookinfo-label">本</span><span>{book() ? `『${book()!.title}』` : '本に入れていないページ'}</span></div>
                    <Show when={b.heading}><div class="bn-slot-row"><span class="bn-bookinfo-label">見出し</span><span>{b.heading}</span></div></Show>
                    <Show when={b.snippet}><p class="bn-slot-snippet">「{b.snippet}」</p></Show>
                    <input class="bn-slot-memo" value={b.memo} placeholder="メモ（任意）例: 次はボス戦の台詞から" aria-label="しおりのメモ" onInput={(e) => setBookmarkMemo(b.id, e.currentTarget.value)} />
                  </div>
                  <div class="bn-slot-side">
                    <button type="button" class="v21-btn primary bn-slot-load" onClick={() => props.onLoad(b)} disabled={!pg()}>続きから</button>
                    <Show when={sure() === b.id} fallback={<button type="button" class="bn-link" onClick={() => setSure(b.id)}>外す</button>}>
                      <button type="button" class="bn-mini danger" onClick={() => { removeBookmark(b.id); setSure(null) }}>外す</button>
                      <button type="button" class="bn-mini" onClick={() => setSure(null)}>やめる</button>
                    </Show>
                  </div>
                </li>
              )
            }}
          </For>
        </ol>
      </section>
    </div>
  )
}
