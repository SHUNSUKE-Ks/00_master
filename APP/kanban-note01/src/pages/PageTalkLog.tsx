import { type Component, For, Match, Show, Switch, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { state, setState, updateNotebook } from '../store'
import type { Notebook } from '../types'
import {
  countDialogueLines,
  newTalkEntryId,
  parseTalkLog,
  renderTalkEntry,
  serializeTalkLog,
  talkMeasure,
  TALK_LINE_CHARS,
  TALK_MAX_LINES,
  type ParsedTalkLog,
  type TalkEntry,
  type TalkEntryKind,
} from '../utils/talkLog'
import { KEYDECK_ID_PATTERN, KEYDECK_MAX_CHARACTERS, buildKeyDeckImport, downloadJson, suggestKeyDeckId } from '../utils/keydeckExport'
import './PageTalkLog.css'

// 会話ログVIEW。データは「ト書きノート > 会話ログ」タブと同じ（page.body か page.scenarioLogs[key]）。
// 見え方だけを、ゲームのバックログ風（名前札＋字下げ本文＋端の消える区切り）に変える。
// Alt+1〜9 はKeyDeckのDeckボタン（ALT+番号）と同じ番号で、その人物の新しいセリフを「いまの発言の直下」に作る。

const SCOPE_ALL = '__all__'
const SYSTEM_PAGE_IDS = new Set(['inbox-tag-db', 'inbox-archive'])
const SAVE_DELAY_MS = 800

function scopeLabel(key: string) {
  const heading = key.match(/^heading-\d+-h(\d)-(.+)$/)
  if (heading) return `H${heading[1]}  ${heading[2].replace(/-/g, ' ')}`
  if (key === 'togaki-scene-event') return 'ト書きテンプレ'
  return key
}

function autosize(el: HTMLTextAreaElement | undefined) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z" fill="currentColor" />
    <path d="M15.2 9.2a4 4 0 0 1 0 5.6M17.6 6.8a7.4 7.4 0 0 1 0 10.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
  </svg>
)

const MicIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9" y="3.5" width="6" height="11" rx="3" fill="currentColor" />
    <path d="M6.2 11.2a5.8 5.8 0 0 0 11.6 0M12 17v3.5M8.8 20.5h6.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
  </svg>
)

type PageTalkLogProps = {
  /** V2.1: 開く作品・場面を指定する（指定が無ければ会話のある場面を自動で開く） */
  notebookId?: string
  pageId?: string
  /** V2.1: 選べるノートを作品だけに絞る */
  filterNotebook?: (nb: Notebook) => boolean
  /** V2.1: 場面を開いたとき（よく開くの記録用） */
  onPageOpen?: (notebookId: string, pageId: string) => void
  /** V2.1: 番号（Alt+番号）と人物の対応が変わったとき（ヘルプに出す） */
  onCastChange?: (names: string[]) => void
}

const PageTalkLog: Component<PageTalkLogProps> = (props) => {
  const notebooks = () => state.notebooks.filter((n) =>
    n.id && n.id !== 'story-inbox' && n.title !== 'InBox' && (!props.filterNotebook || props.filterNotebook(n)))
  const [notebookId, setNotebookId] = createSignal<string | null>(null)
  const [pageId, setPageId] = createSignal<string | null>(null)
  const [scopeKey, setScopeKey] = createSignal(SCOPE_ALL)

  const notebook = () => state.notebooks.find((n) => n.id === notebookId())
  const pages = () => (notebook()?.pages ?? []).filter((p) => !SYSTEM_PAGE_IDS.has(p.id))
  const page = () => pages().find((p) => p.id === pageId())
  const scopes = () => Object.keys(page()?.scenarioLogs ?? {})

  // 会話（名前：「セリフ」）があるページの一覧。最初に開く場所と「会話のあるページ」案内に使う
  const talkSpots = createMemo(() => {
    const out: Array<{ notebookId: string; pageId: string; scope: string; count: number; label: string }> = []
    for (const nb of notebooks()) {
      for (const p of nb.pages) {
        if (SYSTEM_PAGE_IDS.has(p.id)) continue
        const bodyCount = countDialogueLines(p.body ?? '')
        if (bodyCount) out.push({ notebookId: nb.id!, pageId: p.id, scope: SCOPE_ALL, count: bodyCount, label: `${nb.title} / ${p.title || '無題'}` })
        for (const [key, text] of Object.entries(p.scenarioLogs ?? {})) {
          const count = countDialogueLines(text)
          if (count) out.push({ notebookId: nb.id!, pageId: p.id, scope: key, count, label: `${nb.title} / ${p.title || '無題'} / ${scopeLabel(key)}` })
        }
      }
    }
    return out
  })
  const pageTalkCount = (p: { body?: string; scenarioLogs?: Record<string, string> }) =>
    countDialogueLines(p.body ?? '') + Object.values(p.scenarioLogs ?? {}).reduce((sum, text) => sum + countDialogueLines(text), 0)

  function openSpot(spot: { notebookId: string; pageId: string; scope: string }) {
    flushSave()
    setNotebookId(spot.notebookId)
    setPageId(spot.pageId)
    setScopeKey(spot.scope)
    setState({ selectedNotebookId: spot.notebookId, selectedNotebookPageId: spot.pageId })
  }

  // 最初の1回: いま開いているページに会話があればそこ、無ければ会話のある最初のページを開く
  let initialized = false
  createEffect(() => {
    const list = notebooks()
    if (!list.length) return
    if (!initialized) {
      initialized = true
      if (props.notebookId && list.some((n) => n.id === props.notebookId)) {
        setNotebookId(props.notebookId)
        setPageId(props.pageId ?? null)
        setScopeKey(SCOPE_ALL)
        return
      }
      const current = list.find((n) => n.id === state.selectedNotebookId)?.pages.find((p) => p.id === state.selectedNotebookPageId)
      if (!current || !countDialogueLines(current.body ?? '')) {
        const spot = talkSpots()[0]
        if (spot) {
          setNotebookId(spot.notebookId)
          setPageId(spot.pageId)
          setScopeKey(spot.scope)
          return
        }
      }
    }
    // 選択が無い・消えた場合は、いま開いているノート → 先頭の順で補う（Firestoreの読込は後から届く）
    if (!notebook()) {
      const preferred = list.find((n) => n.id === state.selectedNotebookId) ?? list[0]
      setNotebookId(preferred.id ?? null)
    }
  })
  createEffect(() => {
    const list = pages()
    if (!list.length) return
    if (!page()) {
      const preferred = list.find((p) => p.id === state.selectedNotebookPageId) ?? list[0]
      setPageId(preferred.id)
      setScopeKey(SCOPE_ALL)
    }
  })

  const sourceText = () => {
    const p = page()
    if (!p) return ''
    const key = scopeKey()
    return key === SCOPE_ALL ? p.body ?? '' : p.scenarioLogs?.[key] ?? ''
  }

  const [log, setLog] = createStore<ParsedTalkLog>({ lead: '', entries: [] })
  const [activeId, setActiveId] = createSignal<string | null>(null)
  const [nameMenuFor, setNameMenuFor] = createSignal<string | null>(null)
  const [showOther, setShowOther] = createSignal(false)
  const [saveState, setSaveState] = createSignal<'saved' | 'pending'>('saved')
  const [toastText, setToastText] = createSignal('')
  const refs = new Map<string, HTMLTextAreaElement>()
  let loadedKey = ''
  let lastSerialized: string | null = null
  let toastTimer: ReturnType<typeof setTimeout> | undefined

  function toast(text: string) {
    setToastText(text)
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => setToastText(''), 3200)
  }

  // 外で書き換わったとき（会話ログタブ・別端末の同期）だけ読み直す。自分の書き込みは読み直さない（入力中のカーソルを守る）
  createEffect(() => {
    const src = sourceText()
    const key = `${notebookId()}|${pageId()}|${scopeKey()}`
    if (key === loadedKey && src === lastSerialized) return
    const switched = key !== loadedKey
    loadedKey = key
    lastSerialized = src
    const parsed = parseTalkLog(src)
    setLog({ lead: parsed.lead, entries: parsed.entries })
    if (switched || !parsed.entries.some((e) => e.id === activeId())) {
      const lastDialogue = [...parsed.entries].reverse().find((e) => e.kind === 'dialogue')
      setActiveId(lastDialogue?.id ?? parsed.entries[parsed.entries.length - 1]?.id ?? null)
    }
  })

  // ---- 保存（ノート本体と同じ: 画面はすぐ、Firestore/localStorage は 800ms まとめて） ----
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let pendingNotebookId: string | null = null

  function flushSave() {
    clearTimeout(saveTimer)
    const id = pendingNotebookId
    pendingNotebookId = null
    if (!id) return
    const nb = state.notebooks.find((n) => n.id === id)
    if (nb) updateNotebook(id, { pages: nb.pages, updatedAt: new Date() })
    setSaveState('saved')
  }

  function commit() {
    const nb = notebook()
    const p = page()
    if (!nb?.id || !p) return
    const text = serializeTalkLog(log)
    lastSerialized = text
    const key = scopeKey()
    const nextPages = nb.pages.map((x) => {
      if (x.id !== p.id) return x
      return key === SCOPE_ALL ? { ...x, body: text } : { ...x, scenarioLogs: { ...(x.scenarioLogs ?? {}), [key]: text } }
    })
    setState('notebooks', (prev) => prev.map((n) => (n.id === nb.id ? { ...n, pages: nextPages } : n)))
    if (pendingNotebookId && pendingNotebookId !== nb.id) flushSave()
    pendingNotebookId = nb.id
    setSaveState('pending')
    clearTimeout(saveTimer)
    saveTimer = setTimeout(flushSave, SAVE_DELAY_MS)
  }

  // ---- 発言の操作 ----
  const indexOf = (id: string | null) => (id ? log.entries.findIndex((e) => e.id === id) : -1)

  function focusEntry(id: string, where: 'start' | 'end' = 'end') {
    requestAnimationFrame(() => {
      const el = refs.get(id)
      if (!el) return
      el.focus()
      const pos = where === 'end' ? el.value.length : 0
      el.setSelectionRange(pos, pos)
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  function patchEntry(id: string, patch: Partial<Pick<TalkEntry, 'name' | 'text'>>) {
    const idx = indexOf(id)
    if (idx < 0) return
    setLog('entries', idx, produce((e) => {
      Object.assign(e, patch)
      e.raw = renderTalkEntry(e)
    }))
    commit()
  }

  function insertBelow(kind: TalkEntryKind, name = '') {
    const entry: TalkEntry = { id: newTalkEntryId(), kind, name, text: '', raw: '', sep: '' }
    entry.raw = renderTalkEntry(entry)
    setLog(produce((l) => {
      let idx = l.entries.findIndex((e) => e.id === activeId())
      if (idx < 0) idx = l.entries.length - 1
      if (idx < 0) {
        l.lead = ''
        l.entries.push(entry)
        return
      }
      const prev = l.entries[idx]
      // 新しい発言は必ず空行で区切る（会話ログタブでも1ブロックとして見える）
      entry.sep = prev.sep === '' ? '' : '\n\n'
      prev.sep = '\n\n'
      l.entries.splice(idx + 1, 0, entry)
    }))
    commit()
    setActiveId(entry.id)
    focusEntry(entry.id)
  }

  function removeEntry(id: string) {
    const idx = indexOf(id)
    if (idx < 0) return
    const prevId = log.entries[idx - 1]?.id ?? log.entries[idx + 1]?.id ?? null
    setLog(produce((l) => {
      const [removed] = l.entries.splice(idx, 1)
      if (idx === l.entries.length && idx > 0) l.entries[idx - 1].sep = removed.sep
    }))
    refs.delete(id)
    commit()
    setActiveId(prevId)
    if (prevId) focusEntry(prevId)
  }

  function moveActive(step: number) {
    const idx = indexOf(activeId())
    const next = log.entries[Math.min(Math.max(idx + step, 0), log.entries.length - 1)]
    if (!next) return
    setActiveId(next.id)
    focusEntry(next.id)
  }

  let lastOpened = ''
  createEffect(() => {
    const nbId = notebookId()
    const pgId = page()?.id
    if (!nbId || !pgId || `${nbId}|${pgId}` === lastOpened) return
    lastOpened = `${nbId}|${pgId}`
    props.onPageOpen?.(nbId, pgId)
  })

  // ---- 登場人物（作品の cast → 場面の Character → ログに出てくる順） ----
  const cast = createMemo(() => {
    const titleCast = (notebook()?.cast ?? []).map((c) => c.name.trim()).filter(Boolean)
    const pageCast = (page()?.characters ?? []).map((c) => c.name.trim()).filter(Boolean)
    const registered = titleCast.length ? titleCast : pageCast
    const fromLog = [...new Set(log.entries.filter((e) => e.kind === 'dialogue' && e.name && e.name !== '名前').map((e) => e.name))]
    const names = registered.length ? registered : fromLog.length ? fromLog : ['CharacterA', 'CharacterB']
    return names.slice(0, KEYDECK_MAX_CHARACTERS)
  })

  createEffect(() => props.onCastChange?.(cast()))

  function speakAs(slot: number) {
    const name = cast()[slot]
    if (!name) {
      toast(`Alt+${slot + 1} にはまだ人物がいません（Characterタブで登録）`)
      return
    }
    insertBelow('dialogue', name)
  }

  // Alt+1〜9 は画面のどこにフォーカスがあっても効く（KeyDeckからのALT+番号を受けるため）
  function onWindowKeyDown(ev: KeyboardEvent) {
    if (!ev.altKey || ev.ctrlKey || ev.metaKey) return
    const digit = /^Digit([1-9])$/.exec(ev.code)?.[1] ?? /^Numpad([1-9])$/.exec(ev.code)?.[1]
    if (digit) {
      ev.preventDefault()
      speakAs(Number(digit) - 1)
      return
    }
    if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
      ev.preventDefault()
      moveActive(ev.key === 'ArrowUp' ? -1 : 1)
    }
  }

  function onEntryKeyDown(ev: KeyboardEvent & { currentTarget: HTMLTextAreaElement }, entry: TalkEntry) {
    if (ev.isComposing) return
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault()
      insertBelow('dialogue', entry.kind === 'dialogue' ? entry.name : cast()[0] ?? '')
      return
    }
    if (ev.key === 'Enter' && (entry.kind === 'pillar' || entry.kind === 'direction')) {
      ev.preventDefault()
      moveActive(1)
      return
    }
    if (ev.key === 'Backspace' && ev.currentTarget.value === '' && entry.kind !== 'raw') {
      ev.preventDefault()
      removeEntry(entry.id)
    }
  }

  function exportKeyDeck() {
    const nb = notebook()
    if (!nb) return
    const input = window.prompt('KeyDeckのDeck名（半角の英小文字・数字・_ で58文字まで）', suggestKeyDeckId(nb.id ?? nb.title))
    if (input === null) return
    const deckId = input.trim()
    if (!KEYDECK_ID_PATTERN.test(deckId)) {
      toast('Deck名は 半角の英小文字・数字・_ で書いてください')
      return
    }
    downloadJson(`keydeck_${deckId}.json`, buildKeyDeckImport(deckId, nb.title, cast().map((name) => ({ name }))))
    toast(`書き出しました（${cast().length}人）。PCのKeyDeck「Deck編集 → 取り込み」で読めます`)
  }

  function selectNotebook(id: string) {
    flushSave()
    setNotebookId(id)
    setPageId(null)
    setScopeKey(SCOPE_ALL)
    setState({ selectedNotebookId: id })
  }
  function selectPage(id: string) {
    flushSave()
    setPageId(id)
    setScopeKey(SCOPE_ALL)
    setState({ selectedNotebookPageId: id })
  }

  onMount(() => window.addEventListener('keydown', onWindowKeyDown))
  onCleanup(() => {
    window.removeEventListener('keydown', onWindowKeyDown)
    clearTimeout(toastTimer)
    flushSave()
  })

  const stats = createMemo(() => {
    const dialogues = log.entries.filter((e) => e.kind === 'dialogue')
    return {
      count: dialogues.length,
      over: dialogues.filter((e) => talkMeasure(e.text).over).length,
      other: log.entries.filter((e) => e.kind === 'raw').length,
    }
  })

  return (
    <div class="talklog">
      <div class="tl-bar">
        <div class="tl-bar-title">
          <span class="tl-kicker">TALK LOG</span>
          <strong>会話ログ</strong>
        </div>
        <label class="tl-field">
          <span>Title</span>
          <select value={notebookId() ?? ''} onChange={(e) => selectNotebook(e.currentTarget.value)}>
            <For each={notebooks()}>{(n) => <option value={n.id}>{n.title}</option>}</For>
          </select>
        </label>
        <label class="tl-field">
          <span>ページ</span>
          <select value={pageId() ?? ''} onChange={(e) => selectPage(e.currentTarget.value)}>
            <For each={pages()}>
              {(p) => <option value={p.id}>{(p.title || '無題') + (pageTalkCount(p) ? `（会話 ${pageTalkCount(p)}）` : '')}</option>}
            </For>
          </select>
        </label>
        <Show when={scopes().length}>
          <label class="tl-field">
            <span>範囲</span>
            <select value={scopeKey()} onChange={(e) => { flushSave(); setScopeKey(e.currentTarget.value) }}>
              <option value={SCOPE_ALL}>ページ全体</option>
              <For each={scopes()}>{(key) => <option value={key}>{scopeLabel(key)}</option>}</For>
            </select>
          </label>
        </Show>
        <div class="tl-bar-end">
          <span class="tl-stat">発言 {stats().count}<Show when={stats().over}><em> · 目安超え {stats().over}</em></Show></span>
          <Show when={stats().other}>
            <button type="button" class="tl-toggle" classList={{ on: showOther() }} onClick={() => setShowOther((v) => !v)} title="表・見出し・Choiceなど、会話以外の書式（データは消えません）">
              会話以外 {stats().other}件を{showOther() ? '隠す' : '表示'}
            </button>
          </Show>
          <span class="tl-save" classList={{ pending: saveState() === 'pending' }}>{saveState() === 'pending' ? '保存待ち' : '保存済み'}</span>
          <button type="button" class="tl-btn" onClick={exportKeyDeck} title="登場人物をKeyDeckのDeckとして書き出す（ALT+番号つき）">
            KeyDeckへ書き出し
          </button>
        </div>
      </div>

      <div class="tl-stage">
        <div class="tl-column">
          <Show
            when={page()}
            fallback={<p class="tl-empty">ノートがありません。アイディア帳などでページを作ると、ここで会話ログとして読めます。</p>}
          >
            <Show when={stats().count === 0}>
              <div class="tl-guide">
                <p class="tl-guide-lead">この画面は、<b>名前とセリフ</b>だけを並べて会話を書く場所です。</p>
                <p>
                  「{page()?.title || '無題'}」にはまだ会話（<code>名前：「セリフ」</code>）がありません。
                  下の人物ボタンか <kbd>Alt</kbd>+<kbd>1</kbd> を押すと、ここに最初のセリフができます。
                </p>
                <button type="button" class="tl-btn" onClick={() => speakAs(0)}>
                  {cast()[0] ?? '人物'} のセリフで始める
                </button>
                <Show when={talkSpots().length}>
                  <p class="tl-guide-sub">会話があるページ</p>
                  <div class="tl-spots">
                    <For each={talkSpots().slice(0, 8)}>
                      {(spot) => (
                        <button type="button" class="tl-spot" onClick={() => openSpot(spot)}>
                          <span>{spot.label}</span>
                          <em>会話 {spot.count}</em>
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </Show>
            <Show when={log.entries.length}>
              <For each={log.entries}>
                {(entry) => {
                  const measure = createMemo(() => talkMeasure(entry.text))
                  return (
                    <Show when={entry.kind !== 'raw' || showOther()}>
                    <article
                      class="tl-entry"
                      classList={{ active: activeId() === entry.id, [`is-${entry.kind}`]: true }}
                      onPointerDown={() => {
                        setActiveId(entry.id)
                        if (nameMenuFor() !== entry.id) setNameMenuFor(null)
                      }}
                    >
                      <Switch>
                        <Match when={entry.kind === 'dialogue'}>
                          <div class="tl-main">
                            <div class="tl-plate">
                              <button
                                type="button"
                                class="tl-name"
                                onClick={() => setNameMenuFor(nameMenuFor() === entry.id ? null : entry.id)}
                                title="話者を変える"
                              >
                                {entry.name || '名前'}
                              </button>
                              <span class="tl-rule" aria-hidden="true" />
                              <Show when={nameMenuFor() === entry.id}>
                                <div class="tl-name-menu" role="menu">
                                  <For each={cast()}>
                                    {(name, i) => (
                                      <button
                                        type="button"
                                        role="menuitem"
                                        classList={{ on: name === entry.name }}
                                        onClick={() => { patchEntry(entry.id, { name }); setNameMenuFor(null); focusEntry(entry.id) }}
                                      >
                                        <kbd>{i() + 1}</kbd>{name}
                                      </button>
                                    )}
                                  </For>
                                </div>
                              </Show>
                            </div>
                            <textarea
                              ref={(el) => { refs.set(entry.id, el); queueMicrotask(() => autosize(el)) }}
                              class="tl-text"
                              rows={1}
                              value={entry.text}
                              placeholder="セリフ"
                              onFocus={() => setActiveId(entry.id)}
                              onInput={(e) => { autosize(e.currentTarget); patchEntry(entry.id, { text: e.currentTarget.value }) }}
                              onKeyDown={(e) => onEntryKeyDown(e, entry)}
                            />
                            <Show when={activeId() === entry.id || measure().over}>
                              <div class="tl-meta" classList={{ over: measure().over }}>
                                {measure().chars}字 · {measure().lines}行
                                <Show when={measure().over}>（目安 {TALK_LINE_CHARS}字×{TALK_MAX_LINES}行を超えています）</Show>
                              </div>
                            </Show>
                          </div>
                          <div class="tl-actions">
                            <button type="button" class="tl-icon" title="音声を再生（予定）" aria-label="音声を再生（予定）" onClick={() => toast('音声の再生は今後追加します')}>
                              <SpeakerIcon />
                            </button>
                            <button type="button" class="tl-icon" title="録音（予定）" aria-label="録音（予定）" onClick={() => toast('録音は今後追加します')}>
                              <MicIcon />
                            </button>
                          </div>
                        </Match>
                        <Match when={entry.kind === 'pillar'}>
                          <div class="tl-pillar">
                            <span class="tl-tag">柱</span>
                            <textarea
                              ref={(el) => { refs.set(entry.id, el); queueMicrotask(() => autosize(el)) }}
                              class="tl-pillar-text"
                              rows={1}
                              value={entry.text}
                              placeholder="場所・時間"
                              onFocus={() => setActiveId(entry.id)}
                              onInput={(e) => { autosize(e.currentTarget); patchEntry(entry.id, { text: e.currentTarget.value }) }}
                              onKeyDown={(e) => onEntryKeyDown(e, entry)}
                            />
                          </div>
                        </Match>
                        <Match when={entry.kind === 'direction'}>
                          <div class="tl-direction">
                            <span class="tl-tag">ト</span>
                            <textarea
                              ref={(el) => { refs.set(entry.id, el); queueMicrotask(() => autosize(el)) }}
                              class="tl-direction-text"
                              rows={1}
                              value={entry.text}
                              placeholder="ト書き（動き・間・表情）"
                              onFocus={() => setActiveId(entry.id)}
                              onInput={(e) => { autosize(e.currentTarget); patchEntry(entry.id, { text: e.currentTarget.value }) }}
                              onKeyDown={(e) => onEntryKeyDown(e, entry)}
                            />
                          </div>
                        </Match>
                        <Match when={entry.kind === 'raw'}>
                          <textarea
                            ref={(el) => { refs.set(entry.id, el); queueMicrotask(() => autosize(el)) }}
                            class="tl-raw"
                            rows={1}
                            value={entry.text}
                            onFocus={() => setActiveId(entry.id)}
                            onInput={(e) => { autosize(e.currentTarget); patchEntry(entry.id, { text: e.currentTarget.value }) }}
                            title="会話ログ以外の書式（Event・Choice など）。そのまま残します"
                          />
                        </Match>
                      </Switch>
                    </article>
                    </Show>
                  )
                }}
              </For>
            </Show>
          </Show>
        </div>
      </div>

      <div class="tl-dock">
        <div class="tl-cast" role="toolbar" aria-label="登場人物">
          <For each={cast()}>
            {(name, i) => (
              <button type="button" class="tl-cast-btn" onClick={() => speakAs(i())} title={`Alt+${i() + 1}: ${name} の新しいセリフを直下に作る`}>
                <kbd>{i() + 1}</kbd>
                <span>{name}</span>
              </button>
            )}
          </For>
          <span class="tl-dock-sep" aria-hidden="true" />
          <button type="button" class="tl-cast-btn ghost" onClick={() => insertBelow('pillar')} title="柱（場所・時間）を直下に作る">柱</button>
          <button type="button" class="tl-cast-btn ghost" onClick={() => insertBelow('direction')} title="ト書きを直下に作る">ト書き</button>
        </div>
        <div class="tl-hints">
          <span><kbd>Alt</kbd>+<kbd>1〜9</kbd> 新しいセリフ</span>
          <span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> 同じ人で続ける</span>
          <span><kbd>Alt</kbd>+<kbd>↑↓</kbd> 移動</span>
          <span>空で <kbd>Backspace</kbd> 削除</span>
        </div>
      </div>

      <Show when={toastText()}>
        <div class="tl-toast" role="status">{toastText()}</div>
      </Show>
    </div>
  )
}

export default PageTalkLog
