import { type Component, type JSX, For, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { VersionSelect } from '../v21/VersionTabs'
import NoteEditor, { type EditorApi, primeMemory } from './NoteEditor'
import { ShioriButton, ShioriScreen, saveBookmark } from './Shiori'
import WordPanel from './WordPanel'
import ExportDialog from './ExportDialog'
import FormatBar from './FormatBar'
import { parseLines } from './exportNote'
import {
  closeRightTab, closeTab, contextBook, createNote, createNoteRight, db, flush, goHome, noteById, noteTitle, openNote, openRight, saveState, setSplit, updateNote,
} from './store'
import HomeV31 from './HomeV31'
import PageBook from './PageBook'
import { Icon, SYMBOLS, ViewModePicker, useToast } from './shared'

// Bakeru Note（V3.1）PC用の画面。迷わず書けるシンプルなページ（2026-10-02 利用者）。スマホは MobileV31.tsx
// 1段目＝アプリ全体、2段目＝開いているページのタブ。左＝コピペリスト（InBox と本）、右＝目次と記号キー。
// 2カラム: 左右それぞれにタブ列。NAV（左右のレールと書式バー）は、いま書いている側だけに横から滑り出る。
// 要件: OneDrive/…/BAKERUNOTE/レイアウト相談用_要件定義_20261002.md

const KEYS: Array<[string, string]> = [
  ['Alt+1〜4', '見出し H1〜H4（もう一度で本文）。Ctrl+1〜4 でも（ブラウザに取られる時は Alt+1〜4）'],
  ['Alt+0', '本文に戻す（Ctrl+0 でも）'],
  ['/1〜/3 → Enter', 'その列数の表。セルの中は Tab で次へ、最後のセルで Tab なら行が増える'],
  ['下の書式バー', '見出し・箇条書き・番号・チェック・表など。「編集」で並べ替え'],
  ['Ctrl+C', '選んだ文字をコピー＝InBox にも入る'],
  ['Alt+R', '選んだ文字を単語に登録'],
  ['Alt+N', '新しいページ'],
  ['Alt+B', 'いまの場所にしおりを挟む（ヘッダーの「しおり」から続きを開く）'],
  ['Ctrl+K', 'ページを探す'],
  ['Ctrl+S', 'すぐ保存（ふだんは自動で保存）'],
]

type Side = 'L' | 'R'

const PcV31: Component = () => {
  const [query, setQuery] = createSignal('')
  const [leftPanel, setLeftPanel] = createSignal<string | null>(null)
  const [tocOpen, setTocOpen] = createSignal(true)
  const [exportOpen, setExportOpen] = createSignal(false)
  const [helpOpen, setHelpOpen] = createSignal(false)
  const [shioriOpen, setShioriOpen] = createSignal(false)
  const [focus, setFocus] = createSignal<Side>('L')
  const [caretL, setCaretL] = createSignal(0)
  const [caretR, setCaretR] = createSignal(0)
  const [toast, say] = useToast()
  const apis: Record<Side, EditorApi | undefined> = { L: undefined, R: undefined }
  let searchEl: HTMLInputElement | undefined

  // 2カラムは横幅 900px 以上の時だけ（狭くなったら、設定は残したまま1カラムで見せる）
  const mq = window.matchMedia('(min-width: 900px)')
  const [wideEnough, setWideEnough] = createSignal(mq.matches)
  const onMq = (e: MediaQueryListEvent) => setWideEnough(e.matches)
  onMount(() => mq.addEventListener('change', onMq))
  onCleanup(() => mq.removeEventListener('change', onMq))
  const canSplit = () => wideEnough()
  const splitOn = () => db.split && wideEnough()

  /** いま書いている側（2カラムでなければ左） */
  const side = (): Side => (splitOn() ? focus() : 'L')
  const api = () => apis[side()]
  const noteFor = (s: Side) => noteById(s === 'L' ? db.activeId : db.rightActive)
  const active = () => noteFor(side())
  // 目次は列ごと（2カラムでは、それぞれの列の右 NAV の上に出す）
  const headsOf = (s: Side) => createMemo(() => {
    const n = noteFor(s)
    return n ? parseLines(n.body).map((l, i) => ({ ...l, i })).filter((l) => l.level > 0) : []
  })
  const heads = { L: headsOf('L'), R: headsOf('R') }
  /** カーソルのある場所の見出し（目次で光らせる） */
  const here = (s: Side) => {
    const at = s === 'L' ? caretL() : caretR()
    let hit = -1
    for (const h of heads[s]()) if (h.i <= at) hit = h.i
    return hit
  }
  const [tocR, setTocR] = createSignal(true)
  const tocOf = (s: Side) => (s === 'L' ? tocOpen() : tocR())
  const setTocOf = (s: Side, v: boolean) => (s === 'L' ? setTocOpen(v) : setTocR(v))

  function onKeyDown(e: KeyboardEvent) {
    if (e.isComposing) return
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setFocus('L'); goHome(); queueMicrotask(() => searchEl?.focus()) }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); flush(); say('保存しました') }
    else if (e.altKey && !e.ctrlKey && e.key.toLowerCase() === 'n') { e.preventDefault(); newNote() }
    else if (e.altKey && !e.ctrlKey && e.key.toLowerCase() === 'b') { e.preventDefault(); quickSave() }
    else if (e.key === 'Escape' && (helpOpen() || exportOpen())) { setHelpOpen(false); setExportOpen(false) }
  }
  onMount(() => window.addEventListener('keydown', onKeyDown))
  onCleanup(() => window.removeEventListener('keydown', onKeyDown))
  /** リンクを押した時: 2カラムなら隣の列で開く（読みながら書ける）。1カラムならその場で開く */
  function openRefFrom(from: Side, id: string) {
    if (!splitOn()) { openNote(id); return }
    if (from === 'L') { openRight(id); setFocus('R') } else { openNote(id); setFocus('L') }
  }

  // ---- しおり（セーブ＆ロード） ----
  function quickSave() {
    const n = active()
    const pos = api()?.getPos()
    if (!n || !pos) { say('ページを開いている時に、しおりを挟めます'); return }
    if (saveBookmark(n.id, pos)) say(`しおりを挟みました：${noteTitle(n)}（ヘッダーの「しおり」から続きを開けます）`)
  }
  /** しおりの場所へ。開いている列があればそこで、無ければ左の列で開く */
  function loadBookmark(b: { pageId: string; line: number; offset: number; scroll: number }) {
    setShioriOpen(false)
    const pos = { line: b.line, offset: b.offset, scroll: b.scroll }
    if (splitOn() && db.rightActive === b.pageId) { setFocus('R'); apis.R?.goPos(pos); return }
    if (splitOn() && db.rightIds.includes(b.pageId)) { primeMemory(b.pageId, pos); openRight(b.pageId); setFocus('R'); return }
    setFocus('L')
    if (db.activeId === b.pageId) { apis.L?.goPos(pos); return }
    primeMemory(b.pageId, pos)
    openNote(b.pageId)
  }
  const newNote = () => (side() === 'R' ? createNoteRight() : createNote())
  function toggleSplit() {
    if (!db.split && !canSplit()) { say('2カラムは横幅が 900px 以上の時に使えます'); return }
    setSplit(!db.split)
    setFocus('L')
    say(db.split ? '2カラムにしました（書いている側に NAV が出ます）' : '1カラムに戻しました')
  }

  /** いまの本（書いているページの本 → 無ければ本棚で選んだ本） */
  const ctxBook = () => contextBook(side() === 'L' ? db.activeId : db.rightActive)
  const visibleDicts = () => { const b = ctxBook(); return b ? db.dicts.filter((d) => b.dictIds.includes(d.id)) : db.dicts }

  // ---- 部品（1カラムでも2カラムでも同じ物を使う） ----
  const LeftRail = () => (
    <nav class="bn-rail left" aria-label="コピペリスト" onPointerDown={(e) => e.preventDefault()}>
      <button
        type="button"
        class="bn-rail-btn inbox"
        classList={{ on: leftPanel() === 'inbox' }}
        aria-pressed={leftPanel() === 'inbox'}
        onClick={() => setLeftPanel(leftPanel() === 'inbox' ? null : 'inbox')}
        title="InBox（コピーした単語がすべて集まる）"
      >
        <Icon d="M4 13.5 6.5 5h11l2.5 8.5V19H4zM4 13.5h4.5l1 2h5l1-2H20" />
        <span>InBox</span>
        <Show when={db.words.length}><small class="bn-count">{db.words.length}</small></Show>
      </button>
      <div class="bn-shelf" role="group" aria-label="辞書">
        {/* 本（ノート）を開いている・選んでいる時は、その本に紐づけた辞書だけ */}
        <Show when={ctxBook()}>
          {(nb) => <span class="bn-ctxbook" style={{ '--hue': String(nb().hue) }} title={`『${nb().title}』の辞書だけを出しています`}>{nb().cover}</span>}
        </Show>
        <For each={visibleDicts()}>
          {(b) => (
            <button
              type="button"
              class="bn-book"
              classList={{ on: leftPanel() === b.id }}
              aria-pressed={leftPanel() === b.id}
              style={{ '--bk-hue': String(b.hue) }}
              onClick={() => setLeftPanel(leftPanel() === b.id ? null : b.id)}
              title={`${b.name}の辞書（${db.words.filter((w) => w.dicts.includes(b.id)).length}語）`}
              aria-label={`${b.name}の辞書`}
            >
              <span class="bn-book-kanji">{b.kanji}</span>
            </button>
          )}
        </For>
        <button type="button" class="bn-book add" classList={{ on: leftPanel() === 'add' }} onClick={() => setLeftPanel(leftPanel() === 'add' ? null : 'add')} title={ctxBook() ? 'この本の辞書を足す' : '辞書を足す'} aria-label="辞書を足す">＋</button>
      </div>
    </nav>
  )
  const WordSide = () => (
    <Show when={leftPanel()}>
      {(p) => (
        <aside class="bn-side left" aria-label="単語リスト">
          <WordPanel panel={p()} onPick={(t) => api()?.insertText(t)} onToast={say} onOpen={setLeftPanel} canInsert={!!active()} linkTo={ctxBook()?.id ?? null} />
        </aside>
      )}
    </Show>
  )
  /** 目次（1カラム＝右に重ねる。2カラム＝その列の右 NAV の上に、列ごとに出す） */
  const TocSide = (p: { s: Side; card?: boolean }) => (
    <Show when={noteFor(p.s) && tocOf(p.s)}>
      <aside class="bn-side right" classList={{ 'bn-toc-card': !!p.card }} aria-label={p.s === 'L' ? '目次' : '右の列の目次'}>
        <h2 class="bn-side-title">目次</h2>
        <Show when={heads[p.s]().length} fallback={<p class="bn-lead">見出しがまだありません。行にカーソルを置いて <kbd>Alt+1</kbd>〜<kbd>4</kbd> か下の書式バーの <b>H</b> で見出しになります。</p>}>
          <ol class="bn-toc">
            <For each={heads[p.s]()}>
              {(h) => (
                <li style={{ '--lv': String(h.level) }}>
                  <button
                    type="button"
                    classList={{ on: here(p.s) === h.i }}
                    aria-current={here(p.s) === h.i ? 'location' : undefined}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => { setFocus(p.s); apis[p.s]?.jumpTo(h.i) }}
                  >
                    <span class="bn-toc-lv">H{h.level}</span>{h.text || '（空の見出し）'}
                  </button>
                </li>
              )}
            </For>
          </ol>
        </Show>
      </aside>
    </Show>
  )
  const RightRail = (p: { s?: Side }) => (
    <Show when={active()}>
      <nav class="bn-rail right" aria-label="右のナビ">
        {/* 2カラムでは、目次のボタンは右 NAV のいちばん上 */}
        <Show when={p.s}>
          {(s) => (
            <button type="button" class="bn-rail-btn" classList={{ on: tocOf(s()) }} aria-pressed={tocOf(s())} onPointerDown={(e) => e.preventDefault()} onClick={() => setTocOf(s(), !tocOf(s()))} title="この列の目次">
              <Icon d="M4.5 6h1M4.5 12h1M4.5 18h1M9 6h10.5M11 12h8.5M13 18h6.5" /><span>目次</span>
            </button>
          )}
        </Show>
        <div class="bn-symkeys" role="group" aria-label="記号キー" onPointerDown={(e) => e.preventDefault()}>
          <For each={SYMBOLS}>{(k) => <button type="button" title={k.title} aria-label={k.title} onClick={() => api()?.symbol(k.id)}>{k.id}</button>}</For>
        </div>
      </nav>
    </Show>
  )
  /** ページ1枚（タイトル・本文・書式バー）。id で作り直す（打つたびには作り直さない） */
  const NoteView = (p: { s: Side; fallback: JSX.Element }) => (
    <Show when={noteFor(p.s) ? (p.s === 'L' ? db.activeId : db.rightActive) : null} keyed fallback={p.fallback}>
      {(id) => {
        const note = noteById(id)!
        return (
          <div class="bn-note">
            <div class="bn-note-head">
              <input class="bn-title" value={note.title} placeholder="タイトル（無くてもよい）" aria-label="タイトル" onInput={(e) => updateNote(id, { title: e.currentTarget.value })} />
              <PageBook pageId={id} />
            </div>
            <NoteEditor note={note} onReady={(a) => { apis[p.s] = a }} onCaretLine={p.s === 'L' ? setCaretL : setCaretR} onToast={say} onOpenRef={(rid) => openRefFrom(p.s, rid)} />
            <Show when={side() === p.s}>
              <FormatBar onPick={(fid) => apis[p.s]?.format(fid)} />
            </Show>
          </div>
        )
      }}
    </Show>
  )
  /** 右の列が空の時: 開くページを選ぶ */
  const RightEmpty = () => (
    <div class="bn-pick">
      <p class="bn-pick-lead">右の列で開くページを選ぶ</p>
      <button type="button" class="v21-btn primary" onClick={createNoteRight}>＋ 新しいページ</button>
      <ul>
        <For each={[...db.pages].filter((n) => n.id !== db.activeId).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 30)}>
          {(n) => <li><button type="button" onClick={() => openRight(n.id)}>{noteTitle(n)}</button></li>}
        </For>
      </ul>
    </div>
  )
  /** 2カラムの各列のタブ列 */
  const PaneTabs = (p: { s: Side }) => {
    const ids = () => (p.s === 'L' ? db.openIds : db.rightIds)
    const cur = () => (p.s === 'L' ? db.activeId : db.rightActive)
    return (
      <nav class="bn-pane-tabs" aria-label={p.s === 'L' ? '左の列のページ' : '右の列のページ'}>
        <Show when={p.s === 'L'}>
          <button type="button" class="bn-tab home" classList={{ on: !db.activeId }} onClick={goHome} title="ホーム">
            <Icon d="M4 11.5 12 5l8 6.5V20h-5.5v-5h-5v5H4z" />
          </button>
        </Show>
        <div class="bn-tab-list">
          <For each={ids()}>
            {(id) => (
              <Show when={noteById(id)}>
                {(note) => (
                  <div class="bn-tab" classList={{ on: cur() === id }}>
                    <button type="button" class="bn-tab-open" aria-current={cur() === id ? 'page' : undefined} onClick={() => (p.s === 'L' ? openNote(id) : openRight(id))} title={noteTitle(note())}>
                      <Show when={cur() === id && side() === p.s}><span class="bn-tab-dot" aria-hidden="true" /></Show>
                      {noteTitle(note())}
                    </button>
                    <button type="button" class="bn-tab-x" onClick={() => (p.s === 'L' ? closeTab(id) : closeRightTab(id))} aria-label={`${noteTitle(note())} のタブを閉じる`}>×</button>
                  </div>
                )}
              </Show>
            )}
          </For>
          <button type="button" class="bn-tab-add" onClick={() => (p.s === 'L' ? createNote() : createNoteRight())} title="この列に新しいページ" aria-label="この列に新しいページ">＋</button>
        </div>
      </nav>
    )
  }

  return (
    <div class="v21 bn">
      {/* 1段目: アプリ全体 */}
      <header class="bn-top">
        <button type="button" class="v21-brand" onClick={() => { setFocus('L'); goHome() }} title="ホーム（ページ一覧）へ">
          <span class="v21-brand-mark">化</span>
          <span class="v21-brand-text"><strong>Bakeru Note</strong><small>シンプルノート</small></span>
        </button>
        <label class="bn-search">
          <Icon d="M10.5 17a6.5 6.5 0 1 0 0-13a6.5 6.5 0 0 0 0 13M20 20l-4.8-4.8" />
          <span class="bn-sr">ページを探す</span>
          <input
            ref={searchEl}
            type="search"
            placeholder="ページを探す（本文も） Ctrl+K"
            value={query()}
            onInput={(e) => { setQuery(e.currentTarget.value); if (db.activeId) { setFocus('L'); goHome() } }}
          />
        </label>
        <button type="button" class="v21-btn primary bn-new" onClick={newNote} title="新しいページ（Alt+N）">＋ 新しいページ</button>
        <ShioriButton onClick={() => setShioriOpen(true)} />
        {/* 保存状態は見せない（読み上げにだけ伝える。2026-10-02 利用者） */}
        <span class="bn-sr" role="status" aria-live="polite">{saveState.text}</span>
        {/* 右端: 2カラム・書き出し・? ・版（いまの版だけ小さく。押すと選べる） */}
        <div class="bn-hbtns">
          <button type="button" class="bn-hbtn" classList={{ on: db.split }} aria-pressed={db.split} onClick={toggleSplit} title="2カラム（左右に並べて書く）">
            <Icon d="M4 5h16v14H4zM12 5v14" /><span>2カラム</span>
          </button>
          <button type="button" class="bn-hbtn" disabled={!active()} onClick={() => setExportOpen(true)} title="テキスト・HTML・Markdown に書き出す">
            <Icon d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" /><span>書き出し</span>
          </button>
          <button type="button" class="bn-hbtn help" onClick={() => setHelpOpen(true)} title="使い方とキー" aria-label="使い方とキー">?</button>
          <VersionSelect current="v31" />
        </div>
      </header>

      {/* 2段目: 開いているページ（行き来して書くため）。2カラムの時は、列ごとのタブ列があるので出さない */}
      <Show when={!splitOn()}>
      <nav class="bn-tabs" aria-label="開いているページ">
          <button type="button" class="bn-tab home" classList={{ on: !db.activeId }} aria-current={!db.activeId ? 'page' : undefined} onClick={goHome}>
            <Icon d="M4 11.5 12 5l8 6.5V20h-5.5v-5h-5v5H4z" /><span>ホーム</span>
          </button>
          <div class="bn-tab-list">
            <For each={db.openIds}>
              {(id) => (
                <Show when={noteById(id)}>
                  {(note) => (
                    <div class="bn-tab" classList={{ on: db.activeId === id }}>
                      <button type="button" class="bn-tab-open" aria-current={db.activeId === id ? 'page' : undefined} onClick={() => openNote(id)} title={noteTitle(note())}>
                        {noteTitle(note())}
                      </button>
                      <button type="button" class="bn-tab-x" onClick={() => closeTab(id)} aria-label={`${noteTitle(note())} のタブを閉じる`} title="タブを閉じる（ページは消えません）">×</button>
                    </div>
                  )}
                </Show>
              )}
            </For>
          </div>
        <Show when={active()}>
          <button type="button" class="bn-toc-btn" classList={{ on: tocOpen() }} aria-pressed={tocOpen()} onClick={() => setTocOpen(!tocOpen())} title="目次（見出しへ飛ぶ）">
            <Icon d="M4.5 6h1M4.5 12h1M4.5 18h1M9 6h10.5M11 12h8.5M13 18h6.5" /><span>目次</span>
          </button>
        </Show>
      </nav>
      </Show>

      <Show
        when={splitOn()}
        fallback={
          <div class="bn-body">
            <LeftRail />
            <WordSide />
            <main class="bn-main">
              <NoteView s="L" fallback={<HomeV31 query={query()} setQuery={setQuery} />} />
            </main>
            <TocSide s="L" />
            <RightRail />
          </div>
        }
      >
        <div class="bn-body bn-split">
          <For each={['L', 'R'] as Side[]}>
            {(s) => (
              <section
                class="bn-pane"
                classList={{ active: focus() === s }}
                aria-label={s === 'L' ? '左の列' : '右の列'}
                onPointerDown={() => focus() !== s && setFocus(s)}
                onFocusIn={() => focus() !== s && setFocus(s)}
              >
                <PaneTabs s={s} />
                <div class="bn-pane-body">
                  <main class="bn-main">
                    <NoteView s={s} fallback={s === 'L' ? <HomeV31 query={query()} setQuery={setQuery} /> : <RightEmpty />} />
                  </main>
                  {/* NAV は書いている側だけ。開くたびに横から滑り出る（作り直すと動きが付く） */}
                  <Show when={focus() === s}>
                    <div class="bn-pane-nav left"><LeftRail /><WordSide /></div>
                    <div class="bn-pane-nav right"><RightRail s={s} /></div>
                  </Show>
                  {/* 目次は列ごと。右 NAV の上（その列の右上）に出す。書いていない側の列でも見える */}
                  <div class="bn-pane-toc"><TocSide s={s} card /></div>
                </div>
              </section>
            )}
          </For>
        </div>
      </Show>

      <Show when={shioriOpen()}>
        <ShioriScreen pageId={active()?.id ?? null} getPos={() => api()?.getPos() ?? null} onLoad={loadBookmark} onClose={() => setShioriOpen(false)} onToast={say} />
      </Show>

      <Show when={exportOpen() && active()}>
        <ExportDialog note={active()!} onClose={() => setExportOpen(false)} onDone={say} />
      </Show>

      <Show when={helpOpen()}>
        <div class="bn-modal-back" onClick={(e) => e.target === e.currentTarget && setHelpOpen(false)}>
          <div class="bn-modal" role="dialog" aria-modal="true" aria-labelledby="bn-help-title">
            <h2 id="bn-help-title">使い方</h2>
            <ol class="bn-help-steps">
              <li>「＋ 新しいページ」で書き始める。タイトルや分類は後からでよい。</li>
              <li>開いたページは2段目にタブで並ぶ。押せば書いていた場所へ戻る。「2カラム」で左右に並べて書ける。</li>
              <li>文字を選んでコピーすると、左の <b>InBox</b> に集まる。InBox で本（人・地・語…）を押すと振り分けられる。</li>
              <li>単語を押すと、カーソルの位置に貼る。</li>
              <li>表のセルには、写真を貼り付け・ドラッグで入れられる（表の上の「写真」でも）。</li>
            </ol>
            <table class="bn-keys">
              <tbody>
                <For each={KEYS}>{([k, t]) => <tr><th><kbd>{k}</kbd></th><td>{t}</td></tr>}</For>
              </tbody>
            </table>
            <ViewModePicker />
            <button type="button" class="v21-btn primary" onClick={() => setHelpOpen(false)} autofocus>閉じる</button>
          </div>
        </div>
      </Show>

      <div class="bn-toast" role="status" aria-live="polite" classList={{ show: !!toast() }}>{toast()}</div>
    </div>
  )
}

export default PcV31
