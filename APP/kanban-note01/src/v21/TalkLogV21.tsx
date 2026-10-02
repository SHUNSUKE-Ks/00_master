import { type Component, For, Match, Show, Switch, createEffect, createMemo, createSignal, onCleanup, onMount, untrack } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { state, setState, updateNotebook } from '../store'
import type { Notebook, PageCharacter } from '../types'
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
import '../pages/PageTalkLog.css'
import { CANDIDATE_HOOKS, RAIL_ICONS, RailButton, WIDE_QUERY, hold, holdPress } from './sideNav'
import CastSidebar from './CastSidebar'
import WwPanelView from './WwPanel'
import { onAction } from './shortcuts'
import { askConfirm, askText } from './dialog'
import { downloadBlob } from '../utils/zipStore'
import { buildVoicePack, canRecord, clips, deleteVoice, formatDuration, keysFor, loadVoiceScope, moveVoice, saveVoice, startRecording, voiceUrl, type Recording, type VoiceClip } from './voiceStore'
import { ensureCastSlots, renameCharacterWithConfirm } from './actions'
import TagPicker from './TagPicker'
import { NARRATOR_NAME, castSlots, go, isDefaultSlotName, isNarratorName } from './nav'

// V2.1 の会話ログ（ログ形式の会話劇）。Vol1.1 の pages/PageTalkLog.tsx を分けて、修正案（2026-09-25）を入れた版。
// - 柱は本文の柱ブロックに書く。柱ブロックに入力しているあいだ（柱の記入ステート）だけ、フッターに今までの柱を候補として出す
// - ト書きは扱わない（ト書きノートの形式のため）。消さずに隠す
// - 代わりに「備考」（テキストブロック。`備考：…`）を置ける
// 修正案のテキスト化: docs/修正案_2026-09-25_テキスト化.md

// 横画面（PC幅）: 左＝目次・人物、右＝Scene・WW・演出（2026-09-28 利用者: 左に人物、右に Scene を置く）。
// 置き方を変えたので、覚えている開き方の鍵も新しくした（最初は 左＝人物・右＝Scene）
const PANELS_KEY = 'note-story-v21-talk-panels2'
type LeftPanel = 'toc' | 'cast'
type RightPanel = 'scenes' | 'ww' | 'tags'
type DrawerTab = 'cast' | 'scenes' | 'ww' | 'tags'

// 候補のHooks（ブロックの種類 → 出す候補）は sideNav.tsx の CANDIDATE_HOOKS（執筆デスクと共通）
const DRAWER_TABS: Array<{ id: DrawerTab; label: string }> = [
  { id: 'cast', label: '人物' },
  { id: 'scenes', label: 'Scene' },
  { id: 'ww', label: 'WW' },
  { id: 'tags', label: '演出' },
]
// 下の帯（Sceneフッター＋人物ボタン）。2026-09-26 利用者の指示で一度しまう。部品は残す
const SHOW_BOTTOM_BAR = false

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

type TalkLogV21Props = {
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

const TalkLogV21: Component<TalkLogV21Props> = (props) => {
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
  // 名前札: 押す＝この行の話者を入れ替えるメニュー／0.6秒長押し＝その場で名前を編集（2026-09-27 利用者。1秒→0.6秒）
  // 名前を変えると、作品の登場人物（DB）と全場面のセリフが一緒に変わる（サイドバーの ✎ と同じ処理）
  const PLATE_HOLD_MS = 600
  const [plateEditFor, setPlateEditFor] = createSignal<string | null>(null)
  const [pressingFor, setPressingFor] = createSignal<string | null>(null)
  let plateTimer: ReturnType<typeof setTimeout> | undefined
  let plateStart = { x: 0, y: 0 }
  let plateLongFired = false
  let plateCommitted = false
  function platePressStart(e: PointerEvent, id: string) {
    plateLongFired = false
    plateStart = { x: e.clientX, y: e.clientY }
    clearTimeout(plateTimer)
    setPressingFor(id)
    plateTimer = setTimeout(() => {
      plateLongFired = true
      setPressingFor(null)
      setNameMenuFor(null)
      navigator.vibrate?.(25)
      plateCommitted = false
      setPlateEditFor(id)
    }, PLATE_HOLD_MS)
  }
  function platePressMove(e: PointerEvent) {
    if (Math.hypot(e.clientX - plateStart.x, e.clientY - plateStart.y) > 10) platePressCancel()
  }
  function platePressCancel() {
    clearTimeout(plateTimer)
    setPressingFor(null)
  }
  function plateClick(id: string) {
    if (plateLongFired) { plateLongFired = false; return } // 長押しのあとの click は無視
    setNameMenuFor(nameMenuFor() === id ? null : id)
  }
  async function commitPlate(entryId: string, from: string, value: string) {
    if (plateCommitted || plateEditFor() !== entryId) return
    plateCommitted = true
    plateLongFired = false // 長押しで札が入力欄に替わるので、長押しのあとの click は来ない。ここで戻す
    setPlateEditFor(null)
    const to = value.trim()
    const nbId = notebook()?.id
    if (!nbId || !to || to === from) { focusEntry(entryId); return }
    const problem = await renameCharacterWithConfirm(nbId, castInfo().base, from, to)
    if (problem === 'cancelled') { focusEntry(entryId); return }
    if (problem) { toast(problem); return }
    toast(`「${from}」を「${to}」に変えました（作品の登場人物と全セリフ）`)
    focusEntry(entryId)
  }
  onCleanup(() => clearTimeout(plateTimer))
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
    const parsed = parseTalkLog(src, { notes: true })
    setLog({ lead: parsed.lead, entries: parsed.entries })
    if (switched || !parsed.entries.some((e) => e.id === activeId())) {
      const lastDialogue = [...parsed.entries].reverse().find((e) => e.kind === 'dialogue')
      setActiveId(lastDialogue?.id ?? parsed.entries[parsed.entries.length - 1]?.id ?? null)
    }
  })

  // ---- 音声: セリフごとに録音して再生する（2026-09-28。録音はこの端末の IndexedDB。voiceStore.ts） ----
  const voiceScope = () => `${notebookId() ?? ''}|${pageId() ?? ''}|${scopeKey()}`
  const dialogueLines = createMemo(() => log.entries.filter((e) => e.kind === 'dialogue'))
  const voiceKeys = createMemo(() => keysFor(voiceScope(), dialogueLines().map((e) => ({ id: e.id, text: e.text }))))
  const voiceOf = (id: string): VoiceClip | undefined => { const k = voiceKeys().get(id); return k ? clips().get(k.key) : undefined }
  const voiceCount = createMemo(() => dialogueLines().filter((e) => voiceOf(e.id)).length)
  /** どのセリフにも合わなくなった録音（別の端末・タブで書き換えたなど） */
  const orphanVoices = createMemo(() => {
    const live = new Set([...voiceKeys().values()].map((k) => k.key))
    return [...clips().values()].filter((c) => !live.has(c.key)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  })
  const [orphanOpen, setOrphanOpen] = createSignal(false)

  // 書き直したら、入力欄を離れたときに録音を新しい文字へ付け替える
  let voiceSnap: { entryId: string; key: string } | null = null
  function voiceFocus(entry: TalkEntry) {
    const k = entry.kind === 'dialogue' ? voiceKeys().get(entry.id) : undefined
    voiceSnap = k ? { entryId: entry.id, key: k.key } : null
  }
  function voiceBlur(entry: TalkEntry) {
    const snap = voiceSnap
    voiceSnap = null
    if (!snap || snap.entryId !== entry.id) return
    const k = voiceKeys().get(entry.id)
    if (!k || k.key === snap.key || !clips().has(snap.key)) return
    void moveVoice(snap.key, { scope: voiceScope(), hash: k.hash, occ: k.occ, name: entry.name, text: entry.text }, { edited: true })
  }

  // 再生（1つの Audio を使い回す。新しく鳴らすと前のは止まる）
  const player = typeof Audio !== 'undefined' ? new Audio() : null
  const [playingId, setPlayingId] = createSignal<string | null>(null)
  const [playingAll, setPlayingAll] = createSignal(false)
  let playToken = 0
  let allToken = 0
  let playingUrl: string | null = null
  function releaseUrl() { if (playingUrl) URL.revokeObjectURL(playingUrl); playingUrl = null }
  function stopVoice() {
    playToken += 1
    allToken += 1
    if (player && !player.paused) player.pause()
    releaseUrl()
    setPlayingId(null)
    setPlayingAll(false)
  }
  /** 1つ鳴らす。最後まで鳴ったら true */
  async function playKey(key: string, id: string): Promise<boolean> {
    if (!player) return false
    const token = ++playToken
    player.pause()
    releaseUrl()
    const url = await voiceUrl(key)
    if (!url || token !== playToken) { if (url) URL.revokeObjectURL(url); return false }
    playingUrl = url
    setPlayingId(id)
    const done = new Promise<boolean>((resolve) => { player.onended = () => resolve(true); player.onerror = () => resolve(false); player.onpause = () => { if (token !== playToken) resolve(false) } })
    player.src = url
    try { await player.play() } catch { if (token === playToken) { setPlayingId(null); toast('再生できませんでした') } return false }
    const ok = await done
    if (token === playToken) { setPlayingId(null); releaseUrl() }
    return ok && token === playToken
  }
  async function playLine(entry: TalkEntry) {
    if (playingId() === entry.id) { stopVoice(); return }
    const k = voiceKeys().get(entry.id)
    if (!k || !clips().has(k.key)) { toast('まだ録音がありません。右のマイクで録ります'); return }
    allToken += 1
    setPlayingAll(false)
    await playKey(k.key, entry.id)
  }
  /** 録音のあるセリフを、上から順に通して鳴らす（鳴っている行を選んで見せる） */
  async function playAll() {
    if (playingAll()) { stopVoice(); return }
    const my = ++allToken
    setPlayingAll(true)
    for (const e of dialogueLines()) {
      if (my !== allToken) return
      const k = voiceKeys().get(e.id)
      if (!k || !clips().has(k.key)) continue
      setActiveId(e.id)
      refs.get(e.id)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
      const ok = await playKey(k.key, e.id)
      if (!ok || my !== allToken) return
      await new Promise((r) => setTimeout(r, 250))
    }
    if (my === allToken) setPlayingAll(false)
  }

  // 録音（マイクを押す＝録り始める、もう一度押す＝止めて保存）
  const [recFor, setRecFor] = createSignal<string | null>(null)
  const [recMs, setRecMs] = createSignal(0)
  const [recLevel, setRecLevel] = createSignal<() => number>(() => 0)
  let recording: Recording | null = null
  let recTimer: ReturnType<typeof setInterval> | undefined
  async function toggleRecord(entry: TalkEntry) {
    if (recFor() === entry.id) { await finishRecording(); return }
    if (recFor()) await finishRecording()
    if (!canRecord()) { toast('この端末（ブラウザ）では録音できません'); return }
    if (voiceOf(entry.id) && !(await askConfirm({ title: '録り直しますか？', message: '今の録音は、新しい録音に置き換わります。', okLabel: '録り直す' }))) return
    stopVoice()
    try {
      recording = await startRecording()
    } catch (e) {
      const name = (e as { name?: string } | null)?.name
      toast(name === 'NotAllowedError' ? 'マイクの使用が許可されていません（ブラウザのサイト設定で許可してください）' : 'マイクを使えませんでした')
      return
    }
    const r = recording
    setRecLevel(() => r.level)
    setRecFor(entry.id)
    setRecMs(0)
    const t0 = Date.now()
    clearInterval(recTimer)
    recTimer = setInterval(() => setRecMs(Date.now() - t0), 200)
  }
  async function finishRecording() {
    const id = recFor()
    const r = recording
    recording = null
    clearInterval(recTimer)
    setRecFor(null)
    setRecLevel(() => () => 0)
    if (!id || !r) return
    const rec = await r.stop()
    const entry = log.entries.find((e) => e.id === id)
    const k = voiceKeys().get(id)
    if (!entry || !k || rec.blob.size === 0) { toast('録音が空でした'); return }
    await saveVoice(voiceScope(), { hash: k.hash, occ: k.occ, name: entry.name, text: entry.text }, rec)
    toast(`録音しました（${formatDuration(rec.durationMs)}）`)
  }
  async function removeVoice(entry: TalkEntry) {
    const v = voiceOf(entry.id)
    if (!v) return
    if (!(await askConfirm({ title: 'この録音を消しますか？', message: `${entry.name || '名前'}「${entry.text.slice(0, 30)}」の録音（${formatDuration(v.durationMs)}）。元に戻せません。`, okLabel: '消す', danger: true }))) return
    if (playingId() === entry.id) stopVoice()
    await deleteVoice(v.key)
  }
  /** 合わない音声を、選んでいるセリフに付け直す */
  async function attachOrphan(c: VoiceClip) {
    const e = log.entries.find((x) => x.id === activeId() && x.kind === 'dialogue')
    if (!e) { toast('付けたいセリフを選んでから押してください'); return }
    if (voiceOf(e.id)) { toast('そのセリフにはもう録音があります'); return }
    const k = voiceKeys().get(e.id)!
    await moveVoice(c.key, { scope: voiceScope(), hash: k.hash, occ: k.occ, name: e.name, text: e.text }, { edited: c.text !== e.text })
    toast(`「${e.text.slice(0, 16)}」に付けました`)
  }
  /** この範囲の録音を ZIP（音声ファイル＋voices.json）で書き出す。将来 novelEngine へ納品するときに本文と結び直す */
  const [packing, setPacking] = createSignal(false)
  async function exportVoices() {
    const nb = notebook()
    const p = page()
    if (!nb?.id || !p || packing()) return
    setPacking(true)
    try {
      let pillar = ''
      let n = 0
      const lines = []
      for (const e of log.entries) {
        if (e.kind === 'pillar') { pillar = e.text.trim(); continue }
        if (e.kind !== 'dialogue') continue
        const k = voiceKeys().get(e.id)
        n += 1
        if (k) lines.push({ lineNo: n, name: e.name, text: e.text, pillar, hash: k.hash, occ: k.occ, key: k.key })
      }
      const range = scopeKey() === SCOPE_ALL ? 'ページ全体' : scopeLabel(scopeKey())
      const pack = await buildVoicePack({ scope: voiceScope(), title: { id: nb.id, name: nb.title }, page: { id: p.id, title: p.title }, range, lines })
      if (!pack.count) { toast('書き出す録音がありません'); return }
      const safe = (t: string) => (t || '無題').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)
      const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      downloadBlob(`voice_${safe(nb.title)}_${safe(p.title)}_${day}.zip`, pack.blob)
      toast(`録音 ${pack.count}件を ZIP で書き出しました（voices.json つき）`)
    } finally { setPacking(false) }
  }

  // 作品・ページ・範囲を替えたら、その範囲の録音を読む（録音中・再生中なら止める）
  createEffect(() => {
    const scope = voiceScope()
    untrack(() => { if (recording) { recording.cancel(); recording = null; clearInterval(recTimer); setRecFor(null) } stopVoice(); setOrphanOpen(false) })
    if (notebookId() && pageId()) void loadVoiceScope(scope)
  })
  onCleanup(() => { recording?.cancel(); clearInterval(recTimer); stopVoice() })

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
    return entry.id
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

  // ---- 登場人物: 作品の9つの枠（名前は作品のDB＝nb.cast で一元管理。初期は Character1〜9） ----
  const logNames = createMemo(() => [...new Set(log.entries.filter((e) => e.kind === 'dialogue' && e.name && e.name !== '名前' && !isNarratorName(e.name)).map((e) => e.name))])
  const castInfo = createMemo(() => {
    const nb = notebook()
    const base: PageCharacter[] = nb ? castSlots(nb, logNames()) : []
    return { names: base.map((c) => c.name.trim()).slice(0, KEYDECK_MAX_CHARACTERS), base, placeholder: false }
  })
  // 9つの枠がまだ保存されていない作品は、開いたときに保存する（1作品1回）
  const ensured = new Set<string>()
  createEffect(() => {
    const id = notebook()?.id
    const names = logNames()
    if (!id || ensured.has(id) || !page()) return
    ensured.add(id)
    untrack(() => ensureCastSlots(id, names))
  })
  const cast = () => castInfo().names

  createEffect(() => props.onCastChange?.(cast()))

  // 立ち絵（作品の登場人物に portrait があれば、名前札の左に小さく出す）
  const portraitOf = (name: string) => (notebook()?.cast ?? []).find((c) => c.name === name && c.portrait)

  function speakAs(slot: number) {
    const name = cast()[slot]
    if (!name) {
      toast(`Alt+${slot + 1} にはまだ人物がいません（人物パネルの「＋ 人物を足す」で足せます）`)
      return
    }
    insertBelow('dialogue', name)
  }

  /** ナレーション（地の文）。全作品共通で Alt+0。名前は画面に出さない */
  function speakNarration() {
    insertBelow('dialogue', NARRATOR_NAME)
  }

  // Alt+1〜9 は画面のどこにフォーカスがあっても効く（KeyDeckからのALT+番号を受けるため）
  function onWindowKeyDown(ev: KeyboardEvent) {
    if (!ev.altKey || ev.ctrlKey || ev.metaKey) return
    const digit = /^Digit([0-9])$/.exec(ev.code)?.[1] ?? /^Numpad([0-9])$/.exec(ev.code)?.[1]
    if (digit) {
      ev.preventDefault()
      if (digit === '0') speakNarration()
      else speakAs(Number(digit) - 1)
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

  async function exportKeyDeck() {
    const nb = notebook()
    if (!nb) return
    const input = await askText({
      title: 'KeyDeckへ書き出し',
      label: 'Deck名',
      message: '半角の英小文字・数字・_ で58文字まで',
      value: suggestKeyDeckId(nb.id ?? nb.title),
      okLabel: '書き出す',
      validate: (v) => (KEYDECK_ID_PATTERN.test(v.trim()) ? '' : 'Deck名は 半角の英小文字・数字・_ で書いてください'),
    })
    if (input === null) return
    const deckId = input.trim()
    downloadJson(`keydeck_${deckId}.json`, buildKeyDeckImport(deckId, nb.title, cast().map((name) => ({ name })), { narration: NARRATOR_NAME }))
    toast(`書き出しました（${cast().length}人＋ナレーション）。PCのKeyDeck「Deck編集 → 取り込み」で読めます`)
  }

  // ---- 柱（Scene） ----
  // 柱は本文の柱ブロックに書く（毎回フッターから選ばせない）。
  // 柱ブロックに入力しているあいだ（＝柱の記入ステート）だけ、フッターに今までの柱を候補として出す。
  const PILLAR_LINE = /^柱[：:](.+)$/
  const [pillarFocus, setPillarFocus] = createSignal<string | null>(null)
  const focusedPillar = () => log.entries.find((e) => e.id === pillarFocus() && e.kind === 'pillar')

  // いまの行が属する場面（直前の柱。無ければ最初の柱）
  const currentScene = createMemo(() => {
    const idx = indexOf(activeId())
    const upto = idx < 0 ? log.entries : log.entries.slice(0, idx + 1)
    const pillars = (list: readonly TalkEntry[]) => list.filter((e) => e.kind === 'pillar' && e.text.trim())
    return (pillars(upto).pop() ?? pillars(log.entries)[0])?.text.trim() ?? ''
  })

  // 候補＝この場面の他の柱 → 作品の他の場面の柱 → 以前作ったタグ。入力中の柱ブロック自身は除く
  const pillarCandidates = createMemo(() => {
    const nb = notebook()
    const found = new Set<string>()
    const add = (t: string) => { const v = t.trim(); if (v) found.add(v) }
    for (const e of log.entries) if (e.kind === 'pillar' && e.id !== pillarFocus()) add(e.text)
    for (const p of nb?.pages ?? []) {
      const texts: Array<[string, string]> = [[SCOPE_ALL, p.body ?? ''], ...Object.entries(p.scenarioLogs ?? {})]
      for (const [key, text] of texts) {
        if (p.id === page()?.id && key === scopeKey()) continue
        for (const line of text.split('\n')) {
          const m = line.match(PILLAR_LINE)
          if (m) add(m[1])
        }
      }
    }
    for (const t of nb?.sceneTags ?? []) add(t)
    return [...found]
  })
  const pillarQuery = () => (focusedPillar()?.text ?? '').trim().toLowerCase()
  const pillarMatches = createMemo(() => {
    const q = pillarQuery()
    return q ? pillarCandidates().filter((t) => t.toLowerCase().includes(q)) : pillarCandidates()
  })

  function pickPillar(tag: string) {
    const entry = focusedPillar()
    if (!entry) return
    patchEntry(entry.id, { text: tag })
    const el = refs.get(entry.id)
    if (el) {
      el.value = tag
      autosize(el)
      el.focus()
      el.setSelectionRange(tag.length, tag.length)
    }
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
  // 端末ごとに登録したショートカット（設定 → ショートカット）
  onCleanup(onAction((action) => {
    const m = /^talk\.speak\.(\d)$/.exec(action)
    if (!m) return
    if (m[1] === '0') speakNarration()
    else speakAs(Number(m[1]) - 1)
  }))
  onCleanup(() => {
    window.removeEventListener('keydown', onWindowKeyDown)
    clearTimeout(toastTimer)
    flushSave()
  })

  const stats = createMemo(() => {
    const dialogues = log.entries.filter((e) => e.kind === 'dialogue')
    return {
      count: dialogues.length,
      over: dialogues.filter((e) => !isNarratorName(e.name) && talkMeasure(e.text).over).length,
      other: log.entries.filter((e) => e.kind === 'raw' || e.kind === 'direction').length,
    }
  })

  // ---- PC幅: 左右の縦長NAV（アイコン1マス）。狭い画面では出さず、下の帯を使う ----
  const mq = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(WIDE_QUERY) : null
  const [wide, setWide] = createSignal(mq?.matches ?? false)
  const onWideChange = (e: MediaQueryListEvent) => setWide(e.matches)
  onMount(() => mq?.addEventListener?.('change', onWideChange))
  onCleanup(() => mq?.removeEventListener?.('change', onWideChange))

  // どのパネルを開いているかは端末ごとに覚える（見え方の好みなので同期しない）
  const savedPanels = (() => {
    try { return JSON.parse(localStorage.getItem(PANELS_KEY) || 'null') as { left: LeftPanel | null; right: RightPanel | null } | null } catch { return null }
  })()
  const [leftPanel, setLeftPanel] = createSignal<LeftPanel | null>(savedPanels ? savedPanels.left : 'cast')
  const [rightPanel, setRightPanel] = createSignal<RightPanel | null>(savedPanels ? savedPanels.right : 'scenes')
  createEffect(() => {
    const value = { left: leftPanel(), right: rightPanel() }
    try { localStorage.setItem(PANELS_KEY, JSON.stringify(value)) } catch { /* 無視 */ }
  })
  const toggleLeft = (p: LeftPanel) => setLeftPanel(leftPanel() === p ? null : p)
  const toggleRight = (p: RightPanel) => setRightPanel(rightPanel() === p ? null : p)

  // ---- ページ（場面）の並び: 目次・前へ・次へ ----
  const orderedPages = createMemo(() => [...pages()].sort((a, b) => a.order - b.order))
  const pageIndex = () => orderedPages().findIndex((p) => p.id === pageId())
  const prevPage = () => orderedPages()[pageIndex() - 1]
  const nextPage = () => orderedPages()[pageIndex() + 1]
  let stageRef: HTMLDivElement | undefined
  function goPage(id: string) {
    selectPage(id)
    requestAnimationFrame(() => stageRef?.scrollTo?.({ top: 0 }))
  }

  // 柱へ移る（入力はしない。見せるだけ）
  function showEntry(id: string) {
    setActiveId(id)
    requestAnimationFrame(() => refs.get(id)?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  }

  // ---- Scene一覧: 作品の全ての柱と、それがある場面 ----
  const sceneIndex = createMemo(() => {
    const map = new Map<string, Array<{ pageId: string; title: string }>>()
    for (const p of orderedPages()) {
      const names = p.id === pageId()
        ? log.entries.filter((e) => e.kind === 'pillar').map((e) => e.text.trim())
        : (p.body ?? '').split('\n').map((l) => l.match(PILLAR_LINE)?.[1]?.trim() ?? '')
      for (const name of names) {
        if (!name) continue
        const where = map.get(name) ?? []
        if (!where.some((w) => w.pageId === p.id)) where.push({ pageId: p.id, title: p.title || '無題' })
        map.set(name, where)
      }
    }
    return [...map.entries()].map(([name, where]) => ({ name, where }))
  })
  let pendingPillar: string | null = null
  function jumpToPillar(name: string, targetPageId: string) {
    if (targetPageId !== pageId()) {
      pendingPillar = name
      goPage(targetPageId)
      return
    }
    const entry = log.entries.find((e) => e.kind === 'pillar' && e.text.trim() === name)
    if (entry) showEntry(entry.id)
  }
  createEffect(() => {
    void log.entries.length
    if (!pendingPillar) return
    const entry = log.entries.find((e) => e.kind === 'pillar' && e.text.trim() === pendingPillar)
    if (entry) {
      pendingPillar = null
      showEntry(entry.id)
    }
  })

  const castRole = (name: string) => (notebook()?.cast ?? []).find((c) => c.name === name)?.role ?? ''

  // ---- 演出tag を貼る: いま備考に書いていればカーソル位置へ、そうでなければ直下に備考を作って貼る ----
  function insertTagHere(tag: string) {
    const active = log.entries.find((e) => e.id === activeId())
    const el = active ? refs.get(active.id) : undefined
    if (active?.kind === 'note' && el && document.activeElement === el) {
      const start = el.selectionStart ?? el.value.length
      const end = el.selectionEnd ?? start
      const before = el.value.slice(0, start)
      const after = el.value.slice(end)
      const piece = (before && !/\s$/.test(before) ? ' ' : '') + tag + (after.startsWith(' ') ? '' : ' ')
      const next = before + piece + after
      patchEntry(active.id, { text: next })
      el.value = next
      autosize(el)
      const caret = before.length + piece.length
      el.setSelectionRange(caret, caret)
      return
    }
    const id = insertBelow('note')
    const text = `${tag} `
    patchEntry(id, { text })
    requestAnimationFrame(() => {
      const note = refs.get(id)
      if (!note) return
      note.value = text
      autosize(note)
      note.focus()
      note.setSelectionRange(text.length, text.length)
    })
  }

  // ---- 候補のHooks: 入力しているブロックの種類で、開く候補を決める ----
  // この表が「ブロックの種類 → 出す候補」の正。将来 KeyDeck が端末に出す盤面を選ぶときも、これを元にする。
  //   PC幅: pcAuto のものはその側のパネルを自動で切り替える / スマホ幅: mobileAuto のものはオーバーレイを自動で開く
  //   （自動で開かないものも、スマホの「候補」ボタンを押したときに開くタブとして使う）
  const [drawerOpen, setDrawerOpen] = createSignal(false)
  const [drawerTab, setDrawerTab] = createSignal<DrawerTab>('cast')
  let drawerAuto = false

  function enterBlock(entry: TalkEntry) {
    setActiveId(entry.id)
    voiceFocus(entry)
    if (entry.kind === 'pillar') setPillarFocus(entry.id)
    const hook = CANDIDATE_HOOKS[entry.kind]
    if (!hook) return
    if (wide()) {
      if (!hook.pcAuto) return
      if (hook.side === 'left') setLeftPanel(hook.panel as LeftPanel)
      else setRightPanel(hook.panel as RightPanel)
      return
    }
    setDrawerTab(hook.panel)
    if (hook.mobileAuto && !drawerOpen()) {
      setDrawerOpen(true)
      drawerAuto = true
    }
  }
  function leaveBlock(entry: TalkEntry) {
    voiceBlur(entry)
    if (entry.kind === 'pillar') setPillarFocus(null)
    // 自動で開いたオーバーレイは、ブロックを離れたら閉じる（自分で開いたものは閉じない）
    if (drawerAuto) {
      drawerAuto = false
      setDrawerOpen(false)
    }
  }

  // ---- パネルの中身（PCの左右パネルとスマホのオーバーレイで同じものを使う） ----
  const TocPanel = () => (
    <>
      <h3 class="tl-side-title">目次</h3>
      <ol class="tl-stepper">
        <For each={orderedPages()}>
          {(p, i) => (
            <li classList={{ current: p.id === pageId(), done: i() < pageIndex() }}>
              <button type="button" class="tl-step" onClick={() => goPage(p.id)}>
                <span class="tl-step-dot">{i() + 1}</span>
                <span class="tl-step-body">
                  <strong>{p.title || '無題'}</strong>
                  <small>会話 {pageTalkCount(p)}</small>
                </span>
              </button>
              <Show when={p.id === pageId()}>
                <ul class="tl-step-sub">
                  <For each={log.entries.filter((e) => e.kind === 'pillar' && e.text.trim())}>
                    {(e) => (
                      <li>
                        <button type="button" onClick={() => showEntry(e.id)}><span>柱</span>{e.text}</button>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </li>
          )}
        </For>
      </ol>
    </>
  )

  const CastPanel = () => (
    <>
      <CastSidebar
        notebookId={notebook()?.id}
        names={cast()}
        placeholder={castInfo().placeholder}
        base={() => castInfo().base}
        onSpeak={speakAs}
        onNarration={speakNarration}
        portraitOf={portraitOf}
        roleOf={castRole}
        onMessage={toast}
        onOpenTitle={notebook()?.id ? () => { flushSave(); go({ name: 'title', notebookId: notebook()!.id! }) } : undefined}
      />
      <p class="tl-side-title tl-side-sub">ブロックを足す</p>
      <div class="tl-side-blocks" onPointerDown={hold}>
        <button type="button" onClick={() => insertBelow('pillar')} title="柱ブロック（入ると今までの柱が候補に出ます）">＋ 柱</button>
        <button type="button" onClick={() => insertBelow('note')} title="備考（テキストブロック）">＋ 備考</button>
      </div>
    </>
  )

  // 柱ブロックに入力しているあいだは「柱の候補」（押すとその柱ブロックに入る）、ふだんは作品の柱の一覧（押すと移る）
  const ScenesPanel = () => (
    <Show
      when={focusedPillar()}
      fallback={
        <>
          <h3 class="tl-side-title">Scene一覧</h3>
          <p class="tl-side-lead">作品の中の柱です。場面の名前を押すと、その柱へ移ります。</p>
          <div class="tl-side-scenes">
            <For each={sceneIndex()} fallback={<p class="tl-side-lead">まだ柱がありません。</p>}>
              {(sc) => (
                <div class="tl-side-scene">
                  <strong>{sc.name}</strong>
                  <div>
                    <For each={sc.where}>
                      {(w) => (
                        <button type="button" classList={{ here: w.pageId === pageId() }} onClick={() => jumpToPillar(sc.name, w.pageId)}>{w.title}</button>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </>
      }
    >
      <h3 class="tl-side-title">柱の候補</h3>
      <p class="tl-side-lead">
        {pillarQuery() ? `「${focusedPillar()!.text.trim()}」を含む ${pillarMatches().length}件` : `今までの柱 ${pillarCandidates().length}件`}。押すと、いま書いている柱に入ります。
      </p>
      <div class="tl-scene-list tl-side-picks" onPointerDown={hold}>
        <For
          each={pillarMatches()}
          fallback={<p class="tl-scene-none">{pillarCandidates().length ? '一致する柱がありません。このまま書けば、次から候補に出ます。' : 'まだ柱がありません。ここで書いた柱が、次から候補に出ます。'}</p>}
        >
          {(tag) => <button type="button" classList={{ on: tag === focusedPillar()?.text.trim() }} onClick={() => pickPillar(tag)}>{tag}</button>}
        </For>
      </div>
    </Show>
  )

  // WW: 押すと、書いている行のカーソルの位置に名前を貼る
  function insertNameHere(name: string) {
    const active = log.entries.find((e) => e.id === activeId())
    const el = active ? refs.get(active.id) : undefined
    if (!active || !el) { toast('先に、名前を入れたい行を押してください'); return }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const next = el.value.slice(0, start) + name + el.value.slice(end)
    patchEntry(active.id, { text: next })
    el.value = next
    autosize(el)
    el.focus()
    el.setSelectionRange(start + name.length, start + name.length)
  }
  const WwPanel = () => <WwPanelView notebookId={notebook()?.id} onPick={(name) => insertNameHere(name)} />

  const TagsPanel = () => (
    <>
      <h3 class="tl-side-title">演出tag</h3>
      <p class="tl-side-lead">押すと、いま書いている備考に貼ります。備考でなければ、直下に備考を作って貼ります。</p>
      <TagPicker onPick={insertTagHere} keepFocus />
    </>
  )

  const panelView = (p: LeftPanel | RightPanel) =>
    p === 'toc' ? <TocPanel /> : p === 'cast' ? <CastPanel /> : p === 'scenes' ? <ScenesPanel /> : p === 'ww' ? <WwPanel /> : <TagsPanel />

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
          <span class="tl-voice-bar">
            <span class="tl-stat" title="録音のあるセリフ／セリフの数">音声 {voiceCount()}/{dialogueLines().length}</span>
            <button type="button" class="tl-toggle tl-play-all" classList={{ on: playingAll() }} disabled={!voiceCount() && !playingAll()} onClick={() => void playAll()} title="録音のあるセリフを上から順に鳴らす">
              {playingAll() ? '■ 止める' : '▶ 通して再生'}
            </button>
            <button type="button" class="tl-toggle" disabled={!clips().size || packing()} onClick={() => void exportVoices()} title="この範囲の録音を、音声ファイルと一覧（voices.json）の ZIP でダウンロード">{packing() ? '書き出し中…' : 'ZIP で書き出し'}</button>
            <Show when={orphanVoices().length}>
              <button type="button" class="tl-toggle" classList={{ on: orphanOpen() }} onClick={() => setOrphanOpen((v) => !v)} title="どのセリフにも合わなくなった録音">合わない音声 {orphanVoices().length}</button>
            </Show>
          </span>
          <span class="tl-save" classList={{ pending: saveState() === 'pending' }}>{saveState() === 'pending' ? '保存待ち' : '保存済み'}</span>
          <button type="button" class="tl-btn" onClick={exportKeyDeck} title="登場人物をKeyDeckのDeckとして書き出す（ALT+番号つき）">
            KeyDeckへ書き出し
          </button>
        </div>
      </div>

      <Show when={orphanOpen() && orphanVoices().length}>
        <div class="tl-orphans" role="region" aria-label="合わない音声">
          <p>セリフの文字が別の所で変わり、どのセリフにも合わなくなった録音です。付けたいセリフを選んで「選んでいるセリフに付ける」。</p>
          <ul>
            <For each={orphanVoices()}>
              {(c) => (
                <li>
                  <span class="tl-orphan-text">{c.name || '名前'}「{c.text}」<small>{formatDuration(c.durationMs)}</small></span>
                  <button type="button" class="tl-toggle" classList={{ on: playingId() === `orphan:${c.key}` }} onClick={() => { if (playingId() === `orphan:${c.key}`) stopVoice(); else void playKey(c.key, `orphan:${c.key}`) }}>{playingId() === `orphan:${c.key}` ? '■' : '▶'}</button>
                  <button type="button" class="tl-toggle" onPointerDown={hold} onClick={() => void attachOrphan(c)}>選んでいるセリフに付ける</button>
                  <button type="button" class="tl-toggle" onClick={async () => { if (await askConfirm({ title: 'この録音を消しますか？', message: `「${c.text.slice(0, 30)}」の録音。元に戻せません。`, okLabel: '消す', danger: true })) void deleteVoice(c.key) }}>消す</button>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>

      <div class="tl-body">
      {/* 左の縦長NAV（PC幅のみ）: 目次（ステッパー）／登場人物／Scene一覧 */}
      <Show when={wide() && page()}>
        <nav class="tl-rail left" aria-label="左のナビ">
          <RailButton d={RAIL_ICONS.toc} label="目次" title="目次（場面のステッパー）" on={leftPanel() === 'toc'} onClick={() => toggleLeft('toc')} />
          <RailButton d={RAIL_ICONS.cast} label="人物" title="登場人物（押すとその人のセリフ）" on={leftPanel() === 'cast'} onClick={() => toggleLeft('cast')} />
        </nav>
        <Show when={leftPanel()}>
          {(p) => <aside class="tl-side left">{panelView(p())}</aside>}
        </Show>
      </Show>

      <div class="tl-stage" ref={stageRef}>
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
                  // ナレーション（地の文）は名前札を出さず、字数の目安も当てない
                  const narr = () => entry.kind === 'dialogue' && isNarratorName(entry.name)
                  const measure = createMemo(() => { const m = talkMeasure(entry.text); return narr() ? { ...m, over: false } : m })
                  return (
                    <Show when={entry.kind === 'dialogue' || entry.kind === 'note' || entry.kind === 'pillar' || showOther()}>
                    <article
                      class="tl-entry"
                      classList={{ active: activeId() === entry.id, [`is-${entry.kind}`]: true, 'is-narration': narr() }}
                      onPointerDown={() => {
                        setActiveId(entry.id)
                        if (nameMenuFor() !== entry.id) setNameMenuFor(null)
                      }}
                    >
                      <Switch>
                        <Match when={entry.kind === 'dialogue'}>
                          <div class="tl-main">
                            <Show when={!narr()}>
                            <div class="tl-plate">
                              <span class="tl-plate-row">
                                <Show when={portraitOf(entry.name)}>
                                  {(c) => (
                                    <img
                                      class="tl-face"
                                      src={c().portrait}
                                      alt=""
                                      loading="lazy"
                                      style={{ 'object-position': `${c().focusX ?? '50%'} ${c().focusY ?? '15%'}` }}
                                    />
                                  )}
                                </Show>
                                <Show
                                  when={plateEditFor() === entry.id}
                                  fallback={
                                    <button
                                      type="button"
                                      class="tl-name"
                                      classList={{ pressing: pressingFor() === entry.id }}
                                      onPointerDown={(e) => platePressStart(e, entry.id)}
                                      onPointerMove={platePressMove}
                                      onPointerUp={platePressCancel}
                                      onPointerLeave={platePressCancel}
                                      onPointerCancel={platePressCancel}
                                      onContextMenu={(e) => e.preventDefault()}
                                      onClick={() => plateClick(entry.id)}
                                      title="押す＝この行の話者を入れ替える／0.6秒長押し＝名前を変える"
                                    >
                                      {entry.name || '名前'}
                                    </button>
                                  }
                                >
                                  <input
                                    class="tl-name-input"
                                    value={entry.name}
                                    aria-label="名前（変えると作品の登場人物と全セリフが変わる）"
                                    enterkeyhint="done"
                                    ref={(el) => requestAnimationFrame(() => { el.focus(); el.select() })}
                                    onKeyDown={(e) => {
                                      if (e.isComposing) return
                                      if (e.key === 'Enter') { e.preventDefault(); commitPlate(entry.id, entry.name, e.currentTarget.value) }
                                      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); plateCommitted = true; plateLongFired = false; setPlateEditFor(null); focusEntry(entry.id) }
                                    }}
                                    onBlur={(e) => commitPlate(entry.id, entry.name, e.currentTarget.value)}
                                  />
                                </Show>
                              </span>
                              <span class="tl-rule" aria-hidden="true" />
                              <Show when={nameMenuFor() === entry.id}>
                                <div class="tl-name-menu" role="menu">
                                  <p class="tl-name-menu-hint">この行の話者を入れ替えます。名前そのものを変えるときは、名前を0.6秒長押し。</p>
                                  <For each={cast()}>
                                    {(name, i) => (
                                      <button
                                        type="button"
                                        role="menuitem"
                                        classList={{ on: name === entry.name }}
                                        onClick={() => { patchEntry(entry.id, { name }); setNameMenuFor(null); focusEntry(entry.id) }}
                                      >
                                        <kbd>{i() + 1}</kbd>{name}<Show when={isDefaultSlotName(name, i())}><small class="tl-name-empty">空き</small></Show>
                                      </button>
                                    )}
                                  </For>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => { patchEntry(entry.id, { name: NARRATOR_NAME }); setNameMenuFor(null); focusEntry(entry.id) }}
                                  >
                                    <kbd>0</kbd>ナレーション（名前なし）
                                  </button>
                                </div>
                              </Show>
                            </div>
                            </Show>
                            <textarea
                              ref={(el) => { refs.set(entry.id, el); queueMicrotask(() => autosize(el)) }}
                              class="tl-text"
                              rows={1}
                              value={entry.text}
                              placeholder="セリフ"
                              onFocus={() => enterBlock(entry)}
                              onBlur={() => leaveBlock(entry)}
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
                          <div class="tl-actions" onPointerDown={hold}>
                            {(() => {
                              const press = holdPress(() => void removeVoice(entry))
                              return (
                                <button
                                  type="button"
                                  class="tl-icon tl-voice-play"
                                  classList={{ 'has-voice': !!voiceOf(entry.id), playing: playingId() === entry.id, edited: !!voiceOf(entry.id)?.edited }}
                                  title={voiceOf(entry.id) ? `再生（${formatDuration(voiceOf(entry.id)!.durationMs)}）／0.6秒長押し＝録音を消す${voiceOf(entry.id)!.edited ? '。録音のあとでセリフが変わっています' : ''}` : 'まだ録音がありません'}
                                  aria-label={playingId() === entry.id ? '止める' : '再生'}
                                  {...press.handlers}
                                  onClick={() => { if (press.consumed()) return; void playLine(entry) }}
                                >
                                  <SpeakerIcon />
                                  <Show when={voiceOf(entry.id)}>{(v) => <small class="tl-voice-len">{formatDuration(v().durationMs)}</small>}</Show>
                                </button>
                              )
                            })()}
                            <button
                              type="button"
                              class="tl-icon tl-voice-rec"
                              classList={{ recording: recFor() === entry.id }}
                              title={recFor() === entry.id ? '止めて保存' : voiceOf(entry.id) ? '録り直す' : '録音する（もう一度押すと止めて保存）'}
                              aria-label={recFor() === entry.id ? '録音を止めて保存' : '録音する'}
                              onClick={() => void toggleRecord(entry)}
                            >
                              <Show when={recFor() === entry.id} fallback={<MicIcon />}>
                                <span class="tl-rec-dot" style={{ transform: `scale(${1 + recLevel()() * 0.7})` }} />
                                <small class="tl-voice-len">{formatDuration(recMs())}</small>
                              </Show>
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
                              placeholder="場所・時間（下に今までの柱が出ます）"
                              onFocus={() => enterBlock(entry)}
                              onBlur={() => leaveBlock(entry)}
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
                        <Match when={entry.kind === 'note'}>
                          <div class="tl-note">
                            <span class="tl-tag">備考</span>
                            <textarea
                              ref={(el) => { refs.set(entry.id, el); queueMicrotask(() => autosize(el)) }}
                              class="tl-note-text"
                              rows={1}
                              value={entry.text}
                              placeholder="備考（補足・メモ。改行して続けられる）"
                              onFocus={() => enterBlock(entry)}
                              onBlur={() => leaveBlock(entry)}
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
          <Show when={page()}>
            {/* 会話ログのいちばん下: 前のページへ／次のページへ */}
            <nav class="tl-pager" aria-label="ページ送り">
              <button type="button" class="prev" disabled={!prevPage()} onClick={() => prevPage() && goPage(prevPage()!.id)}>
                <span>← 前のページへ</span>
                <small>{prevPage()?.title ?? 'ここが最初のページ'}</small>
              </button>
              <button type="button" class="next" disabled={!nextPage()} onClick={() => nextPage() && goPage(nextPage()!.id)}>
                <span>次のページへ →</span>
                <small>{nextPage()?.title ?? 'ここが最後のページ'}</small>
              </button>
            </nav>
          </Show>
        </div>
      </div>

      {/* 右の縦長NAV（PC幅のみ）: WW／演出tag */}
      <Show when={wide() && page()}>
        <Show when={rightPanel()}>
          {(p) => <aside class="tl-side right">{panelView(p())}</aside>}
        </Show>
        <nav class="tl-rail right" aria-label="右のナビ">
          <RailButton d={RAIL_ICONS.scenes} label="Scene" title="Scene一覧（柱ブロックに入ると柱の候補）" on={rightPanel() === 'scenes'} onClick={() => toggleRight('scenes')} />
          <RailButton d={RAIL_ICONS.ww} label="WW" title="WW（アイテム・武器・スキル・用語）" on={rightPanel() === 'ww'} onClick={() => toggleRight('ww')} />
          <RailButton d={RAIL_ICONS.tags} label="演出" title="演出tag（タグ辞書）" on={rightPanel() === 'tags'} onClick={() => toggleRight('tags')} />
        </nav>
      </Show>
      </div>

      {/* Sceneフッター。ふだんは「いまの行の場面」を出し、柱ブロックに入力しているあいだだけ今までの柱を候補に出す */}
      <Show when={SHOW_BOTTOM_BAR && page() && (!wide() || focusedPillar())}>
        <div class="tl-scene" classList={{ picking: !!focusedPillar() }}>
          <Show
            when={focusedPillar()}
            fallback={
              <>
                <span class="tl-scene-label">Scene</span>
                <Show when={currentScene()} fallback={<span class="tl-scene-empty">未設定</span>}>
                  <span class="tl-scene-chip">{currentScene()}</span>
                </Show>
                <span class="tl-scene-hint">柱ブロックに入ると、ここに今までの柱が出ます</span>
              </>
            }
          >
            {/* 押してもフォーカスを柱ブロックから動かさない（記入ステートのまま選べる） */}
            <div class="tl-scene-picker" onPointerDown={(e) => e.preventDefault()}>
              <div class="tl-scene-picker-head">
                <span class="tl-scene-label">柱の候補</span>
                <small>{pillarQuery() ? `「${focusedPillar()!.text.trim()}」を含む ${pillarMatches().length}件` : `今までの柱 ${pillarCandidates().length}件`}</small>
              </div>
              <div class="tl-scene-list">
                <For
                  each={pillarMatches()}
                  fallback={<p class="tl-scene-none">{pillarCandidates().length ? "一致する柱がありません。このまま書けば、次から候補に出ます。" : "まだ柱がありません。ここで書いた柱が、次から候補に出ます。"}</p>}
                >
                  {(tag) => (
                    <button type="button" classList={{ on: tag === focusedPillar()?.text.trim() }} onClick={() => pickPillar(tag)}>{tag}</button>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={SHOW_BOTTOM_BAR && !wide()}>
      <div class="tl-dock">
        <div class="tl-cast" role="toolbar" aria-label="登場人物">
          <button type="button" class="tl-cast-btn tl-narr-btn" onClick={speakNarration} title="Alt+0: ナレーション（名前なし・全作品共通）">
            <kbd>0</kbd>
            <span>ナレーション</span>
          </button>
          <For each={cast()}>
            {(name, i) => (
              <button type="button" class="tl-cast-btn" onClick={() => speakAs(i())} title={`Alt+${i() + 1}: ${name} の新しいセリフを直下に作る`}>
                <kbd>{i() + 1}</kbd>
                <span>{name}</span>
              </button>
            )}
          </For>
          <span class="tl-dock-sep" aria-hidden="true" />
          <button type="button" class="tl-cast-btn ghost" onClick={() => insertBelow('pillar')} title="柱ブロックを直下に作る（今までの柱が下に出ます）">柱</button>
          <button type="button" class="tl-cast-btn ghost" onClick={() => insertBelow('note')} title="備考（テキストブロック）を直下に作る">備考</button>
        </div>
        <div class="tl-hints">
          <span><kbd>Alt</kbd>+<kbd>1〜9</kbd> 新しいセリフ</span>
          <span><kbd>Alt</kbd>+<kbd>0</kbd> ナレーション</span>
          <span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> 同じ人で続ける</span>
          <span><kbd>Alt</kbd>+<kbd>↑↓</kbd> 移動</span>
          <span>空で <kbd>Backspace</kbd> 削除</span>
        </div>
      </div>
      </Show>

      <Show when={!wide() && page()}>
        <button
          type="button"
          class="tl-fab"
          classList={{ on: drawerOpen() }}
          onPointerDown={hold}
          onClick={() => { drawerAuto = false; setDrawerOpen(!drawerOpen()) }}
          aria-expanded={drawerOpen()}
          title="候補（人物・Scene・WW・演出tag）"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
          <span>{DRAWER_TABS.find((t) => t.id === drawerTab())?.label}</span>
        </button>
        <Show when={drawerOpen()}>
          <div class="tl-drawer-backdrop" onClick={() => { drawerAuto = false; setDrawerOpen(false) }} />
          <aside class="tl-drawer" aria-label="候補">
            <div class="tl-drawer-tabs" role="tablist" onPointerDown={hold}>
              <For each={DRAWER_TABS}>
                {(t) => (
                  <button type="button" role="tab" classList={{ on: drawerTab() === t.id }} onClick={() => setDrawerTab(t.id)}>{t.label}</button>
                )}
              </For>
              <button type="button" class="tl-drawer-close" aria-label="閉じる" onClick={() => { drawerAuto = false; setDrawerOpen(false) }}>×</button>
            </div>
            <div class="tl-drawer-body">{panelView(drawerTab())}</div>
          </aside>
        </Show>
      </Show>

      <Show when={toastText()}>
        <div class="tl-toast" role="status">{toastText()}</div>
      </Show>
    </div>
  )
}

export default TalkLogV21
