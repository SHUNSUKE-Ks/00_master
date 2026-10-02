import { type Component, For, Show, createSignal } from 'solid-js'
import {
  SHELVES, allGenres, booksOnShelf, createNotebook, db, deleteNotebook, notebookById, pagesOf, selectBook, setShelf, toggleGenre,
  toggleNotebookDict, updateNotebook, type Notebook,
} from './store'

// 本棚（ホームのいちばん上。2026-10-02 利用者）。木の棚に、ノート（本）の背表紙を縦書きで並べる。
// マウスを乗せた本だけ表紙（無地に1字）を見せる。押すと選ぶ＝下のページ一覧がその本のページになる（セレクトタブと同じ働き）。
// 棚は4段。上下の矢印（キーボードの ↑↓ でも）で段を移る。何も選ばなければ「最近のページ」。

/** 本ごとに背の高さと厚みを少し変える（同じ本はいつも同じ形） */
function spineShape(b: Notebook) {
  let h = 0
  for (const ch of b.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const len = [...b.title].length
  return { height: 124 + (h % 6) * 7, width: Math.min(48, Math.max(30, 26 + len * 1.6 + (h % 3) * 2)) }
}

const Bookshelf: Component = () => {
  const [dir, setDir] = createSignal<'up' | 'down'>('down')
  const [sure, setSure] = createSignal(false)
  const [genreDraft, setGenreDraft] = createSignal('')
  const books = () => booksOnShelf(db.shelf)
  const sel = () => notebookById(db.shelfBook)
  const go = (step: number) => {
    const n = db.shelf + step
    if (n < 0 || n >= SHELVES) return
    setDir(step > 0 ? 'down' : 'up')
    setShelf(n)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); go(-1) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); go(1) }
  }

  return (
    <section class="bn-shelfbox" aria-label="本棚" onKeyDown={onKey}>
      <div class="bn-shelf-frame">
        <div class="bn-shelf-side">
          <button type="button" class="bn-shelf-arrow" disabled={db.shelf === 0} onClick={() => go(-1)} aria-label="上の段へ" title="上の段へ（↑）">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
          <span class="bn-shelf-no" aria-live="polite">{db.shelf + 1}<small>/{SHELVES}段</small></span>
          <button type="button" class="bn-shelf-arrow" disabled={db.shelf === SHELVES - 1} onClick={() => go(1)} aria-label="下の段へ" title="下の段へ（↓）">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
        </div>
        {/* 段が変わったら作り直す（上下から滑り込む） */}
        <Show when={String(db.shelf)} keyed>
          {(_k) => (
            <div class="bn-shelf-row" classList={{ [dir()]: true }} role="tablist" aria-label={`本棚の${db.shelf + 1}段目`}>
              <For each={books()}>
                {(b) => {
                  const s = spineShape(b)
                  return (
                    <button
                      type="button"
                      role="tab"
                      class="bn-spine"
                      classList={{ on: db.shelfBook === b.id }}
                      aria-selected={db.shelfBook === b.id}
                      style={{ '--hue': String(b.hue), '--sh': `${s.height}px`, '--sw': `${s.width}px` }}
                      onClick={() => selectBook(b.id)}
                      title={`${b.title}（${pagesOf(b.id).length}ページ）${b.genres.length ? ' ・ ' + b.genres.join('・') : ''}`}
                    >
                      <span class="bn-spine-face" aria-hidden="true">
                        <span class="bn-spine-title">{b.title}</span>
                      </span>
                      <span class="bn-cover" aria-hidden="true"><span>{b.cover}</span></span>
                      <span class="bn-sr">{b.title}</span>
                    </button>
                  )
                }}
              </For>
              <button type="button" class="bn-spine add" onClick={() => createNotebook()} title="この段に本（ノート）を足す" aria-label="この段に本を足す">＋</button>
            </div>
          )}
        </Show>
      </div>
      <div class="bn-shelf-plank" aria-hidden="true" />

      {/* 選んだ本の情報（名前・表紙の字・ジャンル・辞書・段） */}
      <Show when={sel()} keyed>
        {(b) => (
          <div class="bn-bookinfo">
            <span class="bn-bookinfo-cover" style={{ '--hue': String(b.hue) }}>
              <input
                value={b.cover}
                maxLength={2}
                aria-label="表紙の1字"
                title="表紙の1字"
                onChange={(e) => { const c = [...e.currentTarget.value.trim()][0]; if (c) updateNotebook(b.id, { cover: c }); else e.currentTarget.value = b.cover }}
              />
            </span>
            <div class="bn-bookinfo-main">
              <input class="bn-bookinfo-title" value={b.title} aria-label="本の名前" onInput={(e) => updateNotebook(b.id, { title: e.currentTarget.value || '無題の本' })} />
              <div class="bn-bookinfo-row" role="group" aria-label="ジャンル（いくつでも）">
                <span class="bn-bookinfo-label">ジャンル</span>
                <For each={[...new Set([...allGenres(), ...b.genres])]}>
                  {(g) => (
                    <button type="button" class="bn-gchip" classList={{ on: b.genres.includes(g) }} aria-pressed={b.genres.includes(g)} onClick={() => toggleGenre(b.id, g)}>{g}</button>
                  )}
                </For>
                <form class="bn-gadd" onSubmit={(e) => { e.preventDefault(); if (genreDraft().trim()) { toggleGenre(b.id, genreDraft()); setGenreDraft('') } }}>
                  <input value={genreDraft()} onInput={(e) => setGenreDraft(e.currentTarget.value)} placeholder="＋ジャンル" aria-label="ジャンルを足す" />
                </form>
              </div>
              <div class="bn-bookinfo-row" role="group" aria-label="この本で使う辞書">
                <span class="bn-bookinfo-label">辞書</span>
                <For each={db.dicts} fallback={<span class="bn-lead">辞書がまだありません</span>}>
                  {(d) => (
                    <button type="button" class="bn-gchip dict" classList={{ on: b.dictIds.includes(d.id) }} style={{ '--bk-hue': String(d.hue) }} aria-pressed={b.dictIds.includes(d.id)} onClick={() => toggleNotebookDict(b.id, d.id)} title={`${d.name}の辞書`}>
                      {d.kanji}<small>{d.name}</small>
                    </button>
                  )}
                </For>
              </div>
            </div>
            <div class="bn-bookinfo-side">
              <label class="bn-bookinfo-label">段
                <select value={b.shelf} onChange={(e) => { updateNotebook(b.id, { shelf: Number(e.currentTarget.value) }); setShelf(Number(e.currentTarget.value)) }}>
                  <For each={Array.from({ length: SHELVES }, (_, i) => i)}>{(i) => <option value={i}>{i + 1}段目</option>}</For>
                </select>
              </label>
              <Show when={sure()} fallback={<button type="button" class="bn-link" onClick={() => setSure(true)}>この本を消す</button>}>
                <span class="bn-lead">本だけ消します（ページは残ります）</span>
                <button type="button" class="bn-mini danger" onClick={() => { setSure(false); deleteNotebook(b.id) }}>消す</button>
                <button type="button" class="bn-mini" onClick={() => setSure(false)}>やめる</button>
              </Show>
            </div>
          </div>
        )}
      </Show>
    </section>
  )
}

export default Bookshelf
