import { type Component, For, Show, createMemo, createSignal } from 'solid-js'
import { VersionTabs } from '../v21/VersionTabs'
import NoteEditor, { type EditorApi, primeMemory } from './NoteEditor'
import { ShioriButton, ShioriScreen } from './Shiori'
import type { Bookmark } from './store'
import WordPanel from './WordPanel'
import PageBook from './PageBook'
import ExportDialog from './ExportDialog'
import HomeV31 from './HomeV31'
import { parseLines } from './exportNote'
import { closeTab, contextBook, createNote, db, goHome, noteById, noteTitle, openNote, saveState, updateNote } from './store'
import { Icon, SYMBOLS, ViewModePicker, useToast } from './shared'

// Bakeru Note（V3.1）スマホ（Android）用の画面。
// 上＝戻る・タイトル・メニュー、その下＝開いているページのタブ。下＝道具の帯（キーボードの真上に来る）。
// 単語（InBox と本）と目次は、下から出るシートで開く。

type Sheet = 'words' | 'toc' | 'menu' | null

const MobileV31: Component = () => {
  const [query, setQuery] = createSignal('')
  const [sheet, setSheet] = createSignal<Sheet>(null)
  const [shioriOpen, setShioriOpen] = createSignal(false)
  /** しおりの場所へ（開いているページならそのまま、違えば開いてから戻る） */
  function loadBookmark(b: Bookmark) {
    setShioriOpen(false)
    const pos = { line: b.line, offset: b.offset, scroll: b.scroll }
    if (db.activeId === b.pageId) { api?.goPos(pos); return }
    primeMemory(b.pageId, pos)
    openNote(b.pageId)
  }
  const [wordPanel, setWordPanel] = createSignal('inbox')
  const [exportOpen, setExportOpen] = createSignal(false)
  const [caretLine, setCaretLine] = createSignal(0)
  const [toast, say] = useToast()
  let api: EditorApi | undefined

  const active = () => noteById(db.activeId)
  const heads = createMemo(() => {
    const n = active()
    return n ? parseLines(n.body).map((l, i) => ({ ...l, i })).filter((l) => l.level > 0) : []
  })
  const here = () => {
    let at = -1
    for (const h of heads()) if (h.i <= caretLine()) at = h.i
    return at
  }
  /** 本（ノート）を開いている・選んでいる時は、その本の辞書だけ */
  const visibleDicts = () => { const b = contextBook(db.activeId); return b ? db.dicts.filter((d) => b.dictIds.includes(d.id)) : db.dicts }
  const toggle = (s: Sheet) => setSheet(sheet() === s ? null : s)

  return (
    <div class="v21 bn bnm">
      {/* 上の帯 */}
      <header class="bnm-top">
        <Show
          when={active()}
          fallback={
            <div class="bnm-brand">
              <span class="v21-brand-mark">化</span>
              <strong>Bakeru Note</strong>
            </div>
          }
        >
          <button type="button" class="bnm-icon" onClick={goHome} aria-label="ホームへ戻る">
            <Icon d="M15 5l-7 7 7 7" />
          </button>
        </Show>
        <span class="bn-sr" role="status" aria-live="polite">{saveState.text}</span><span class="bnm-gap" />
        <ShioriButton compact onClick={() => { setSheet(null); setShioriOpen(true) }} />
        <button type="button" class="bnm-icon" classList={{ on: sheet() === 'words' }} onClick={() => toggle('words')} aria-label="単語（InBox と本）">
          <Icon d="M4 13.5 6.5 5h11l2.5 8.5V19H4zM4 13.5h4.5l1 2h5l1-2H20" />
          <Show when={db.words.length}><small class="bn-count">{db.words.length}</small></Show>
        </button>
        <button type="button" class="bnm-icon" classList={{ on: sheet() === 'menu' }} onClick={() => toggle('menu')} aria-label="メニュー">
          <Icon d="M5 12h.01M12 12h.01M19 12h.01" />
        </button>
      </header>

      {/* 2段目: 開いているページ */}
      <Show when={db.openIds.length}>
        <nav class="bnm-tabs" aria-label="開いているページ">
          <For each={db.openIds}>
            {(id) => (
              <Show when={noteById(id)}>
                {(n) => (
                  <div class="bnm-tab" classList={{ on: db.activeId === id }}>
                    <button type="button" class="bnm-tab-open" aria-current={db.activeId === id ? 'page' : undefined} onClick={() => openNote(id)}>{noteTitle(n())}</button>
                    <button type="button" class="bnm-tab-x" onClick={() => closeTab(id)} aria-label={`${noteTitle(n())} のタブを閉じる`}>×</button>
                  </div>
                )}
              </Show>
            )}
          </For>
        </nav>
      </Show>

      <main class="bn-main bnm-main">
        <Show
          when={active() ? db.activeId : null}
          keyed
          fallback={
            <>
              <label class="bn-search bnm-search">
                <Icon d="M10.5 17a6.5 6.5 0 1 0 0-13a6.5 6.5 0 0 0 0 13M20 20l-4.8-4.8" />
                <span class="bn-sr">ページを探す</span>
                <input type="search" placeholder="ページを探す（本文も）" value={query()} onInput={(e) => setQuery(e.currentTarget.value)} />
              </label>
              <div class="bnm-home"><HomeV31 query={query()} setQuery={setQuery} /></div>
              <button type="button" class="bnm-fab" onClick={() => createNote()} aria-label="新しいページ">
                <Icon d="M12 5v14M5 12h14" />
              </button>
            </>
          }
        >
          {(id) => {
            const note = noteById(id)!
            return (
              <div class="bn-note bnm-note">
                <input class="bn-title bnm-title" value={note.title} placeholder="タイトル（無くてもよい）" aria-label="タイトル" onInput={(e) => updateNote(id, { title: e.currentTarget.value })} />
                <div class="bnm-pagebook"><PageBook pageId={id} /></div>
                <NoteEditor note={note} onReady={(a) => { api = a }} onCaretLine={setCaretLine} onToast={say} onOpenRef={openNote} />
              </div>
            )
          }}
        </Show>
      </main>

      {/* 下の道具の帯（ページを開いている時）。押してもキーボードを閉じない */}
      <Show when={active()}>
        <nav class="bnm-tools" aria-label="道具" onPointerDown={(e) => e.preventDefault()}>
          <button type="button" class="bnm-tool wide" classList={{ on: sheet() === 'toc' }} onClick={() => toggle('toc')} aria-label="目次">
            <Icon d="M4.5 6h1M4.5 12h1M4.5 18h1M9 6h10.5M11 12h8.5M13 18h6.5" /><span>目次</span>
          </button>
          <For each={SYMBOLS}>
            {(k) => <button type="button" class="bnm-tool" aria-label={k.title} onClick={() => api?.symbol(k.id)}>{k.id === '#' ? 'H' : k.id}</button>}
          </For>
          <button type="button" class="bnm-tool" aria-label="ページへのリンク（@）" onClick={() => api?.format('mention')}>@</button>
          <button type="button" class="bnm-tool" aria-label="リンクカードを入れる" onClick={() => api?.format('link')}>
            <Icon d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
          </button>
          <button type="button" class="bnm-tool" aria-label="表を入れる（3列）" onClick={() => api?.format('table')}>
            <Icon d="M4 5h16v14H4zM4 10h16M4 14.5h16M9.5 5v14M14.5 5v14" />
          </button>
        </nav>
      </Show>

      {/* 下から出るシート */}
      <Show when={sheet()}>
        {(s) => (
          <div class="bnm-sheet-back" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
            <div class="bnm-sheet" role="dialog" aria-modal="true" aria-label={s() === 'words' ? '単語' : s() === 'toc' ? '目次' : 'メニュー'}>
              <div class="bnm-grab" aria-hidden="true" />
              <Show when={s() === 'words'}>
                <div class="bnm-shelf" role="tablist" aria-label="InBox と本">
                  <button type="button" role="tab" class="bnm-shelf-btn inbox" aria-selected={wordPanel() === 'inbox'} classList={{ on: wordPanel() === 'inbox' }} onClick={() => setWordPanel('inbox')}>InBox</button>
                  <For each={visibleDicts()}>
                    {(b) => (
                      <button type="button" role="tab" class="bn-book bnm-book" aria-selected={wordPanel() === b.id} aria-label={`${b.name}の辞書`} classList={{ on: wordPanel() === b.id }} style={{ '--bk-hue': String(b.hue) }} onClick={() => setWordPanel(b.id)}>
                        <span class="bn-book-kanji">{b.kanji}</span>
                      </button>
                    )}
                  </For>
                  <button type="button" class="bn-book add bnm-book" aria-label="辞書を足す" classList={{ on: wordPanel() === 'add' }} onClick={() => setWordPanel('add')}>＋</button>
                </div>
                <div class="bnm-sheet-body">
                  <WordPanel
                    panel={wordPanel()}
                    canInsert={!!active()}
                    onPick={(t) => { setSheet(null); api?.insertText(t); say(`貼りました：${t.slice(0, 20)}`) }}
                    onToast={say}
                    onOpen={setWordPanel}
                    linkTo={contextBook(db.activeId)?.id ?? null}
                  />
                </div>
              </Show>
              <Show when={s() === 'toc'}>
                <div class="bnm-sheet-body">
                  <h2 class="bn-side-title">目次</h2>
                  <Show when={heads().length} fallback={<p class="bn-lead">見出しがまだありません。行にカーソルを置いて、下の <b>H</b> を押すと見出しになります（押すたびに H1→H2→H3→H4→本文）。</p>}>
                    <ol class="bn-toc">
                      <For each={heads()}>
                        {(h) => (
                          <li style={{ '--lv': String(h.level) }}>
                            <button type="button" classList={{ on: here() === h.i }} onClick={() => { setSheet(null); api?.jumpTo(h.i) }}>
                              <span class="bn-toc-lv">H{h.level}</span>{h.text || '（空の見出し）'}
                            </button>
                          </li>
                        )}
                      </For>
                    </ol>
                  </Show>
                </div>
              </Show>
              <Show when={s() === 'menu'}>
                <div class="bnm-sheet-body bnm-menu">
                  <Show when={active()}>
                    <button type="button" class="bnm-menu-item" onClick={() => { setSheet(null); setExportOpen(true) }}>書き出し（テキスト・HTML・Markdown）</button>
                  </Show>
                  <button type="button" class="bnm-menu-item" onClick={() => { setSheet(null); createNote() }}>＋ 新しいページ</button>
                  <div class="bnm-help">
                    <h2 class="bn-side-title">使い方</h2>
                    <ul>
                      <li>文字を長押しして選び、<b>コピー</b>すると InBox に入ります。下に出る「＋単語に登録」でも入ります。</li>
                      <li>右上の InBox で、単語の下の本（人・地・語）を押すと振り分けられます。</li>
                      <li>単語を押すと、カーソルの位置に貼ります。</li>
                      <li>下の <b>H</b> で見出し、<b>目次</b> で見出しへ飛びます。</li>
                    </ul>
                  </div>
                  <ViewModePicker />
                  <div class="bnm-version"><span>版</span><VersionTabs current="v31" compact /></div>
                </div>
              </Show>
            </div>
          </div>
        )}
      </Show>

      <Show when={shioriOpen()}>
        <ShioriScreen pageId={active()?.id ?? null} getPos={() => api?.getPos() ?? null} onLoad={loadBookmark} onClose={() => setShioriOpen(false)} onToast={say} />
      </Show>

      <Show when={exportOpen() && active()}>
        <ExportDialog note={active()!} onClose={() => setExportOpen(false)} onDone={say} />
      </Show>

      <div class="bn-toast bnm-toast" role="status" aria-live="polite" classList={{ show: !!toast() }}>{toast()}</div>
    </div>
  )
}

export default MobileV31
