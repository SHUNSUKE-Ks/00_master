import { type Component, For, Show, createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js'
import { state } from '../store'
import type { PageCharacter } from '../types'
import TagPicker from './TagPicker'
import CastSidebar from './CastSidebar'
import { renameSpeaker } from '../utils/talkLog'
import { CANDIDATE_HOOKS, RAIL_ICONS, RailButton, hold, holdPress, useWide, type CandidatePanel } from './sideNav'
import SwipeRow from './SwipeRow'
import WwPanelView from './WwPanel'
import PlotLinkPopover from './PlotLinkPopover'
import { nodesWithRef, refDraft } from './plotFlow'
import { onAction } from './shortcuts'
import GenreSheet from './GenreSheet'
import { BOOKS, bookTags, isTagShown } from './dictionaries'
import {
  DRAFT_KINDS, MEMO_SHELF, MEMO_STATUS, addDraft, addMemo, draftsOf, findDraft, flushDrafts, liveMemos, memoDaysLeft,
  setDraftKind, setMemoStatus, sweepMemos, trashMemo, updateDraft, type Draft, type DraftKind, type MemoStatus,
} from './drafts'
import { NARRATOR_NAME, castSlots, defaultCastSlots, go, isDefaultSlotName, isStoryNotebook, namedCast, scenePages, updatedTime } from './nav'
import { addCharacter, clearCastSlot, ensureCastSlots, renameCharacterWithConfirm } from './actions'
import SceneGrid from './SceneGrid'
import { addOrderSlot, paletteCells, paletteCount, sceneTag } from './sceneSlots'
import { askForm } from './dialog'
import type { SceneSlot } from '../types'

// 執筆デスク: 作品の下書きと、どの作品にも属さないアイディアメモを書く画面。
// PC: 会話ログと同じ左右の縦長NAV。スマホ（Android）: 右隣の縦長NAV → ジャンルごとの専用サイドバー（GenreSheet）。
// スマホでは候補を自動では開かない（2026-09-27: 柱の行に入るたびに開き直して書けなかったため）。該当するアイコンが光るだけ。
// 本文は1枚のテキスト（書式は会話ログと同じ: 柱：／名前：「」／備考：）。カーソルのある行の種類で候補を開く（CANDIDATE_HOOKS）。
// 入力の型（Template）は、この画面に慣れてから考える（2026-09-26 利用者）。

type Props = {
  shelf: string
  draftId: string
  /** 2カラムの1つとして入れる（小さい見出し・自分の右隣にNAV・サイドバーはこの列の中） */
  embedded?: boolean
  /** 一覧から別の下書きを選んだとき（2カラムでは、その列だけ切り替える） */
  onOpenSheet?: (id: string) => void
  /** 1カラムの見出しに「2カラム」ボタンを出す */
  canSplit?: boolean
  onSplit?: () => void
}
// PC幅: 左＝一覧・人物、右＝Scene・WW・演出（2026-09-28 利用者: 左に人物、右に Scene）
type LeftPanel = 'sheets' | 'cast'
type RightPanel = 'scenes' | 'ww' | 'tags'
type DrawerTab = LeftPanel | RightPanel
type MobileSheet = 'cast' | 'scenes' | 'ww' | 'tags' | 'sheets'
type LineKind = 'pillar' | 'note' | 'dialogue' | 'text'

const PANELS_KEY = 'note-story-v21-desk-panels2'
/** Scene サイドバーの見え方: 一覧（柱）／9グリッド（Sceneスロット）。端末ごとに覚える */
const SCENE_VIEW_KEY = 'note-story-v21-scene-view'
type SceneView = 'list' | 'grid'
const MOBILE_SHEETS: Array<{ id: MobileSheet; label: string; title: string; icon: keyof typeof RAIL_ICONS }> = [
  { id: 'cast', label: '人物', title: 'Character', icon: 'cast' },
  { id: 'scenes', label: 'Scene', title: 'Scene', icon: 'scenes' },
  { id: 'ww', label: 'WW', title: 'WW（World Word）', icon: 'ww' },
  { id: 'tags', label: '演出', title: '共通tag', icon: 'tags' },
  { id: 'sheets', label: '一覧', title: '一覧', icon: 'sheets' },
]
// NAVのアイコンを長押し → 本文のカーソル位置に直書きのタグを入れる（2026-09-27 利用者。"" の中にカーソル）
// タグは [] で囲む（あとで解析しやすいように）。書式: [種類_"中身"]、演出tag: [bg_town_night]
const TEMPLATE_TAGS: Partial<Record<MobileSheet, string>> = {
  cast: '[Character_""]',
  scenes: '[Scene_""]',
  tags: '[演出_""]',
}
// 記号キー（NAVの右下。2026-09-28 利用者）。押すとカーソルの位置に半角の記号を打つ。括弧は選んだ文字を囲む
const SYMBOLS: Array<{ id: string; label: string; title: string }> = [
  { id: '#', label: '#', title: '見出し（章・小見出し）: 行の頭に # 。もう一度押すと ## 、###' },
  { id: '{}', label: '{}', title: '{ } 文中のメモ（本文には出さない、書き手のメモ）' },
  { id: '[]', label: '[]', title: '[ ] タグ（[Scene_"…"] などの直書きタグ）' },
  { id: '()', label: '()', title: '( ) 補足（本文に出る補足）' },
  { id: ':', label: ':', title: ': コロン' },
  { id: '//', label: '//', title: '// 行のメモ（ここから行の終わりまで、本文には出さない）' },
]
const PILLAR = /^柱[：:]\s*(.*)$/
const NOTE = /^備考[：:]/
const DIALOGUE = /^[^\s：:「]{1,24}[：:]「/

type Line = { kind: LineKind; start: number; end: number; text: string }

/** カーソルのある行と、その種類（備考の字下げの続きは備考として扱う） */
function lineAt(value: string, caret: number): Line {
  const start = value.lastIndexOf('\n', caret - 1) + 1
  const nl = value.indexOf('\n', caret)
  const end = nl < 0 ? value.length : nl
  const text = value.slice(start, end)
  let kind: LineKind = PILLAR.test(text) ? 'pillar' : NOTE.test(text) ? 'note' : DIALOGUE.test(text) ? 'dialogue' : 'text'
  if (kind === 'text' && /^\s+\S/.test(text)) {
    const above = value.slice(0, Math.max(0, start - 1)).split('\n').reverse()
    for (const l of above) {
      if (NOTE.test(l)) { kind = 'note'; break }
      if (!/^\s+\S/.test(l)) break
    }
  }
  return { kind, start, end, text }
}

const WritingDeskV21: Component<Props> = (props) => {
  const isMemo = () => props.shelf === MEMO_SHELF
  const notebook = () => (isMemo() ? undefined : state.notebooks.find((n) => n.id === props.shelf))
  const doc = () => findDraft(props.shelf, props.draftId)
  let ta: HTMLTextAreaElement | undefined

  if (isMemo()) sweepMemos()
  else ensureCastSlots(props.shelf)
  onCleanup(flushDrafts)

  // ---- 一覧（同じ棚の下書き／メモ） ----
  const sheets = createMemo(() =>
    (isMemo() ? liveMemos() : draftsOf(props.shelf)).slice().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
  )
  const sheetName = (d: Draft) => d.title.trim() || d.body.trim().split('\n')[0]?.slice(0, 24) || (isMemo() ? '無題のメモ' : '無題の下書き')
  function openSheet(id: string) {
    flushDrafts()
    if (props.onOpenSheet) props.onOpenSheet(id)
    else go({ name: 'desk', shelf: props.shelf, draftId: id })
  }
  function newSheet() {
    const d = isMemo() ? addMemo() : addDraft(props.shelf)
    openSheet(d.id)
  }
  function goBack() {
    flushDrafts()
    if (isMemo()) go({ name: 'memos' })
    else go({ name: 'title', notebookId: props.shelf })
  }

  // ---- 人物: 下書き＝その作品の登場人物。メモ＝作品ごとの登場人物（最近の作品から） ----
  const castGroups = createMemo(() => {
    const nb = notebook()
    if (nb) return [{ title: '', cast: castSlots(nb) }]
    // Title なしのメモ: Alt+1〜9 は CharacterA〜I（初期値）。作品の人物は、その下に番号なしで並べる
    // （以前は直近更新の作品の人物が先頭になり、Alt+番号がその作品の人物を呼んでいた）
    return [
      { title: 'Titleなし', cast: defaultCastSlots() },
      ...state.notebooks
        .filter(isStoryNotebook)
        .sort((a, b) => updatedTime(b) - updatedTime(a))
        .map((n) => ({ title: n.title || '無題', cast: namedCast(n) }))
        .filter((g) => g.cast.length),
    ]
  })
  const numbered = createMemo(() => castGroups()[0]?.cast.map((c) => c.name) ?? [])

  // ---- Scene: 柱の候補（この文書 → 同じ棚 → 作品の場面。メモは全作品） ----
  const pillarPool = createMemo(() => {
    const found = new Set<string>()
    const scan = (text: string) => {
      for (const line of text.split('\n')) {
        const m = line.match(PILLAR)
        if (m && m[1].trim()) found.add(m[1].trim())
      }
    }
    scan(doc()?.body ?? '')
    for (const d of sheets()) if (d.id !== props.draftId) scan(d.body)
    const books = notebook() ? [notebook()!] : state.notebooks.filter(isStoryNotebook)
    for (const nb of books) {
      for (const p of scenePages(nb)) scan(p.body ?? '')
      for (const t of nb.sceneTags ?? []) if (t.trim()) found.add(t.trim())
    }
    return [...found]
  })

  // ---- カーソルの行（Hooks の入口） ----
  const [line, setLine] = createSignal<Line | null>(null)
  const pillarLine = () => (line()?.kind === 'pillar' ? line() : null)
  const pillarQuery = () => (pillarLine()?.text.match(PILLAR)?.[1] ?? '').trim()
  const pillarMatches = createMemo(() => {
    const q = pillarQuery().toLowerCase()
    return pillarPool().filter((t) => t !== pillarQuery() && (!q || t.toLowerCase().includes(q)))
  })
  function readCaret() {
    if (!ta || document.activeElement !== ta) return
    setLine(lineAt(ta.value, ta.selectionStart ?? 0))
  }

  // ---- PC: 左右のパネル（開き方は端末ごとに覚える） ----
  const wideScreen = useWide()
  /** PC の左右パネルを使うか（2カラムの中では、スマホと同じ右隣のNAV＋サイドバー） */
  const wide = () => wideScreen() && !props.embedded
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(PANELS_KEY) || 'null') as { left: LeftPanel | null; right: RightPanel | null } | null } catch { return null }
  })()
  const [leftPanel, setLeftPanel] = createSignal<LeftPanel | null>(saved ? saved.left : 'cast')
  const [rightPanel, setRightPanel] = createSignal<RightPanel | null>(saved ? saved.right : 'scenes')
  createEffect(() => {
    const value = { left: leftPanel(), right: rightPanel() }
    try { localStorage.setItem(PANELS_KEY, JSON.stringify(value)) } catch { /* 無視 */ }
  })
  const toggleLeft = (p: LeftPanel) => setLeftPanel(leftPanel() === p ? null : p)
  const toggleRight = (p: RightPanel) => setRightPanel(rightPanel() === p ? null : p)

  // ---- プロットに付ける（画面を移らずに、この下書きをプロットのフローチャートへ） ----
  const [plotOpen, setPlotOpen] = createSignal(false)
  const plotCount = () => (isMemo() ? 0 : nodesWithRef(notebook(), refDraft(props.draftId)).length)

  // ---- スマホ: 右隣の縦長NAV → ジャンルごとのサイドバー ----
  const [sheet, setSheet] = createSignal<MobileSheet | null>(null)
  const [sheetQuery, setSheetQuery] = createSignal('')
  const [sheetError, setSheetError] = createSignal('')
  const [editingName, setEditingName] = createSignal<string | null>(null)
  function openSheet2(id: MobileSheet) {
    setSheetQuery('')
    setSheetError('')
    setEditingName(null)
    setSheet(sheet() === id ? null : id)
  }
  const closeSheet = () => { setSheet(null); setEditingName(null) }
  /** カーソルのある行に合うジャンル（アイコンを光らせるだけ。自動では開かない） */
  const hintSheet = (): MobileSheet | null => {
    const hook = line() ? CANDIDATE_HOOKS[line()!.kind] : undefined
    return hook ? (hook.panel as MobileSheet) : null
  }

  // 行の種類が変わったときだけ Hooks を当てる（同じ行で打ち続けても開き直さない）
  createEffect(on(() => line()?.kind ?? null, (kind) => {
    const hook = kind ? CANDIDATE_HOOKS[kind] : undefined
    if (!hook) return
    const panel = hook.panel as CandidatePanel
    if (wide()) {
      if (!hook.pcAuto) return
      if (hook.side === 'left') setLeftPanel(panel as LeftPanel)
      else setRightPanel(panel as RightPanel)
      return
    }
    // スマホ: 開かない（アイコンが光るだけ）。開いて閉じるたびに入力欄のフォーカスが揺れて、開き直し続けたため
  }, { defer: true }))

  // ---- カーソル位置へ差し込む ----
  function writeBody(next: string, caret: number) {
    const d = doc()
    if (!d || !ta) return
    updateDraft(props.shelf, d.id, { body: next })
    ta.value = next
    ta.focus()
    ta.setSelectionRange(caret, caret)
    setLine(lineAt(next, caret))
  }
  /** 行として差し込む（いまの行の下に。空行ならその行に） */
  function insertBlock(text: string, caretInText = text.length) {
    if (!ta) return
    const value = ta.value
    const cur = lineAt(value, ta.selectionStart ?? value.length)
    if (!cur.text.trim()) {
      const next = value.slice(0, cur.start) + text + value.slice(cur.end)
      writeBody(next, cur.start + caretInText)
      return
    }
    // ブロックの間は空行1つ（会話ログの書式と同じ）
    const after = value.slice(cur.end).replace(/^\n+/, '')
    const next = value.slice(0, cur.end) + '\n\n' + text + (after ? '\n\n' + after : '')
    writeBody(next, cur.end + 2 + caretInText)
  }
  /** 文中に差し込む。pad: 前後に空白を補う（タグの id 用。名前は日本語の文中に入れるので補わない） */
  function insertInline(text: string, pad = true) {
    if (!ta) return
    const value = ta.value
    const start = ta.selectionStart ?? value.length
    const end = ta.selectionEnd ?? start
    const before = value.slice(0, start)
    const after = value.slice(end)
    let piece = text
    if (pad && before && !/\s$/.test(before) && !/[：:]$/.test(before)) piece = ' ' + piece
    if (pad && after && !/^\s/.test(after)) piece += ' '
    writeBody(before + piece + after, start + piece.length)
  }
  /** 演出tag は [] で囲んで貼る */
  const insertTag = (id: string) => insertInline(`[${id}]`)
  /** 直書きのタグを入れ、"" の中にカーソルを置く */
  function insertTemplate(id: MobileSheet) {
    const tag = TEMPLATE_TAGS[id]
    if (!tag || !ta) return
    const value = ta.value
    const start = ta.selectionStart ?? value.length
    const end = ta.selectionEnd ?? start
    writeBody(value.slice(0, start) + tag + value.slice(end), start + tag.length - 2)
  }
  /** 記号キー: # は行の頭に見出し、括弧は囲む（選んでいなければ間にカーソル）、// はメモの始まり */
  function typeSymbol(id: string) {
    if (!ta) return
    const value = ta.value
    const start = ta.selectionStart ?? value.length
    const end = ta.selectionEnd ?? start
    if (id === '#') {
      const cur = lineAt(value, start)
      const m = cur.text.match(/^(#{1,6})\s?/)
      const level = Math.min(6, (m ? m[1].length : 0) + 1)
      const line = '#'.repeat(level) + ' ' + (m ? cur.text.slice(m[0].length) : cur.text)
      writeBody(value.slice(0, cur.start) + line + value.slice(cur.end), cur.start + line.length)
      return
    }
    if (id === '//') {
      const before = value.slice(0, start)
      const piece = (before && !/\s$/.test(before) ? ' ' : '') + '// '
      writeBody(before + piece + value.slice(end), start + piece.length)
      return
    }
    if (id.length === 2) {
      const inner = value.slice(start, end)
      writeBody(value.slice(0, start) + id[0] + inner + id[1] + value.slice(end), start + 1 + inner.length)
      return
    }
    writeBody(value.slice(0, start) + id + value.slice(end), start + id.length)
  }
  const SymbolKeys = () => (
    <div class="v21-symkeys" role="group" aria-label="記号キー" onPointerDown={hold}>
      <For each={SYMBOLS}>{(k) => <button type="button" title={k.title} aria-label={k.title} onClick={() => typeSymbol(k.id)}>{k.label}</button>}</For>
    </div>
  )
  const speak = (name: string) => {
    const t = `${name}：「」`
    insertBlock(t, t.length - 1)
  }
  function pickPillar(tag: string) {
    const cur = pillarLine()
    if (!cur || !ta) return
    const t = `柱：${tag}`
    writeBody(ta.value.slice(0, cur.start) + t + ta.value.slice(cur.end), cur.start + t.length)
  }

  // ---- Scene の9グリッド（Sceneスロット。テンキー 1〜9＝書く／−＋＝パレット／0＝ラベルだけ置いて発注） ----
  const [sceneView, setSceneViewRaw] = createSignal<SceneView>((() => { try { return localStorage.getItem(SCENE_VIEW_KEY) === 'grid' ? 'grid' : 'list' } catch { return 'list' } })())
  const setSceneView = (v: SceneView) => { setSceneViewRaw(v); try { localStorage.setItem(SCENE_VIEW_KEY, v) } catch { /* 無視 */ } }
  const [palette, setPalette] = createSignal(0)
  /** 9グリッドがいま見えているか（見えている間だけテンキーを受け取る。見えていなければ数字はふつうに打てる） */
  const gridVisible = () => !isMemo() && sceneView() === 'grid' && (wide() ? rightPanel() === 'scenes' : sheet() === 'scenes')
  function pickSlot(slot: SceneSlot) {
    insertInline(sceneTag(slot.title))
    if (!wide()) closeSheet()
  }
  function stepPalette(step: number) {
    const n = paletteCount(notebook())
    setPalette((Math.min(palette(), n - 1) + step + n) % n)
  }
  /** テンキー 0: 画像の無いラベルだけのタグを置き、発注リストに 名前・作品・納品先 を書く */
  async function orderLabel() {
    if (isMemo()) return
    const start = ta?.selectionStart ?? 0
    const end = ta?.selectionEnd ?? start
    const picked = ta ? ta.value.slice(start, end).trim() : ''
    const values = await askForm({
      title: 'ラベルだけの Scene（絵を発注）',
      message: '本文に [Scene_"名前"] を置き、発注リストに 名前・作品・納品先 を書きます。絵ができたら、ギャラリーの写真から「Sceneスロットに登録」で納品します。',
      fields: [
        { name: 'name', label: 'Scene の名前', value: picked || pillarQuery(), placeholder: '例: 村入口の夜', required: true },
        { name: 'note', label: 'どんな絵か', placeholder: '例: 夜の村の門。松明、見張りの兵士', multiline: true },
      ],
      okLabel: '置いて発注',
    })
    const name = values?.name?.trim()
    if (!ta) return
    ta.focus()
    ta.setSelectionRange(start, end)
    if (!name) return
    if (!addOrderSlot(props.shelf, name, values?.note ?? '')) return
    insertInline(sceneTag(name))
    setPalette(paletteCount(notebook()) - 1)
  }
  function onNumpad(e: KeyboardEvent): boolean {
    if (e.altKey || e.ctrlKey || e.metaKey || !gridVisible()) return false
    if (e.code === 'NumpadAdd') { stepPalette(1); return true }
    if (e.code === 'NumpadSubtract') { stepPalette(-1); return true }
    if (e.code === 'Numpad0') { void orderLabel(); return true }
    const m = /^Numpad([1-9])$/.exec(e.code)
    if (!m) return false
    const slot = paletteCells(notebook(), Math.min(palette(), paletteCount(notebook()) - 1))[Number(m[1]) - 1]
    if (slot) pickSlot(slot)
    return true
  }

  // 端末ごとに登録したショートカット。2カラムでは、いま書いている列（入力欄にカーソルがある方）だけが受け取る
  onCleanup(onAction((action) => {
    if (!ta || document.activeElement !== ta) return
    const m = /^talk\.speak\.(\d)$/.exec(action)
    if (m) {
      const n = Number(m[1])
      const name = n === 0 ? NARRATOR_NAME : numbered()[n - 1]
      if (name) speak(name)
      return
    }
    if (action === 'desk.tag.cast') insertTemplate('cast')
    else if (action === 'desk.tag.scenes') insertTemplate('scenes')
    else if (action === 'desk.tag.tags') insertTemplate('tags')
  }))

  // Alt+0 ナレーション、Alt+1〜9 登場人物（会話ログと同じ）
  function onKeyDown(e: KeyboardEvent) {
    if (e.code.startsWith('Numpad') && onNumpad(e)) { e.preventDefault(); return }
    if (!e.altKey || e.ctrlKey || e.metaKey) return
    const m = e.code.match(/^(?:Digit|Numpad)(\d)$/)
    if (!m) return
    const n = Number(m[1])
    const name = n === 0 ? NARRATOR_NAME : numbered()[n - 1]
    if (!name) return
    e.preventDefault()
    speak(name)
  }

  // ---- アイディアメモの進捗 ----
  const daysLeft = () => { const d = doc(); return d && isMemo() ? memoDaysLeft(d) : null }
  function toTrash() {
    const d = doc()
    if (!d) return
    trashMemo(d.id)
    go({ name: 'memos' })
  }

  // ---- パネルの中身（PCの左右パネルとスマホのオーバーレイで共通） ----
  const SheetsPanel = () => (
    <>
      <h3 class="tl-side-title">{isMemo() ? 'メモ一覧' : '下書き一覧'}</h3>
      <div class="tl-side-scenes v21-desk-sheets">
        <For each={sheets()}>
          {(d) => (
            <button type="button" classList={{ here: d.id === props.draftId }} onClick={() => openSheet(d.id)}>
              <strong>{sheetName(d)}</strong>
              <Show when={isMemo()}><small>{MEMO_STATUS.find((s) => s.id === (d.status ?? 'seed'))!.label}</small></Show>
            </button>
          )}
        </For>
      </div>
      <button type="button" class="v21-btn" onClick={newSheet}>＋ {isMemo() ? '新しいメモ' : '新しい下書き'}</button>
    </>
  )

  // 下書き: 作品の登場人物を、会話ログと同じサイドバーで（足す・名前を変える）
  function renameInDrafts(from: string, to: string) {
    for (const x of draftsOf(props.shelf)) {
      const next = renameSpeaker(x.body, from, to)
      if (next !== x.body) updateDraft(props.shelf, x.id, { body: next })
    }
  }
  const DraftCastPanel = () => (
    <>
      <CastSidebar
        notebookId={props.shelf}
        names={numbered()}
        base={() => castGroups()[0]?.cast ?? []}
        onSpeak={(i) => { const n = numbered()[i]; if (n) speak(n) }}
        onNarration={() => speak(NARRATOR_NAME)}
        portraitOf={(name) => castGroups()[0]?.cast.find((c) => c.name === name && c.portrait)}
        roleOf={(name) => castGroups()[0]?.cast.find((c) => c.name === name)?.role ?? ''}
        onRenamed={renameInDrafts}
        onOpenTitle={() => { flushDrafts(); go({ name: 'title', notebookId: props.shelf }) }}
      />
      <p class="tl-side-title tl-side-sub">ブロックを足す</p>
      <div class="tl-side-blocks" onPointerDown={hold}>
        <button type="button" onClick={() => insertBlock('柱：')}>＋ 柱</button>
        <button type="button" onClick={() => insertBlock('備考：')}>＋ 備考</button>
      </div>
    </>
  )

  // メモ: どの作品にも属さないので、作品ごとの登場人物を並べるだけ（足す・変えるは各作品で）
  const CastPanel = () => (
    <Show when={isMemo()} fallback={<DraftCastPanel />}>
      <h3 class="tl-side-title">登場人物</h3>
      <p class="tl-side-lead">押すと、いまの行の下にその人のセリフ <code>名前：「」</code> を作ります。</p>
      <div class="tl-side-cast" onPointerDown={hold}>
        <button type="button" onClick={() => speak(NARRATOR_NAME)} title="Alt+0（全作品共通）">
          <kbd>0</kbd>
          <span class="tl-side-face empty">地</span>
          <span class="tl-side-name">ナレーション<small>全作品共通</small></span>
        </button>
      </div>
      <For each={castGroups()} fallback={<p class="tl-side-lead">登場人物のいる作品がありません。</p>}>
        {(g, gi) => (
          <>
            <Show when={g.title}><p class="tl-side-title tl-side-sub">{g.title}</p></Show>
            <div class="tl-side-cast" onPointerDown={hold}>
              <For each={g.cast}>
                {(c: PageCharacter, i) => (
                  <button type="button" onClick={() => speak(c.name)} title={gi() === 0 ? `Alt+${i() + 1}` : c.name}>
                    <Show when={gi() === 0 && i() < 9} fallback={<kbd class="v21-kbd-blank"> </kbd>}><kbd>{i() + 1}</kbd></Show>
                    <Show when={c.portrait} fallback={<span class="tl-side-face empty">{[...c.name][0] ?? '?'}</span>}>
                      <img class="tl-side-face" src={c.portrait!} alt="" loading="lazy" style={{ 'object-position': `${c.focusX ?? '50%'} ${c.focusY ?? '15%'}` }} />
                    </Show>
                    <span class="tl-side-name">{c.name}<Show when={c.role}><small>{c.role}</small></Show></span>
                  </button>
                )}
              </For>
            </div>
          </>
        )}
      </For>
      <p class="tl-side-title tl-side-sub">ブロックを足す</p>
      <div class="tl-side-blocks" onPointerDown={hold}>
        <button type="button" onClick={() => insertBlock('柱：')}>＋ 柱</button>
        <button type="button" onClick={() => insertBlock('備考：')}>＋ 備考</button>
      </div>
    </Show>
  )

  const SceneViewTabs = () => (
    <Show when={!isMemo()}>
      <div class="v21-scene-views" role="tablist" aria-label="Scene の見え方" onPointerDown={hold}>
        <button type="button" role="tab" aria-selected={sceneView() === 'list'} classList={{ on: sceneView() === 'list' }} onClick={() => setSceneView('list')}>一覧</button>
        <button type="button" role="tab" aria-selected={sceneView() === 'grid'} classList={{ on: sceneView() === 'grid' }} onClick={() => setSceneView('grid')}>9グリッド</button>
      </div>
    </Show>
  )
  const Grid = () => <SceneGrid notebookId={props.shelf} palette={palette()} onPalette={setPalette} onPick={pickSlot} onOrder={() => void orderLabel()} />
  const ScenesPanel = () => (
    <>
    <SceneViewTabs />
    <Show when={isMemo() || sceneView() === 'list'} fallback={<><h3 class="tl-side-title">Sceneスロット</h3><Grid /></>}>
    <Show
      when={pillarLine()}
      fallback={
        <>
          <h3 class="tl-side-title">Scene一覧</h3>
          <p class="tl-side-lead">{isMemo() ? 'メモと全作品の柱です。' : 'この作品と下書きの柱です。'}押すと、いまの行の下に柱を作ります。</p>
          <form class="v21-cast-side-add" onSubmit={(e) => { e.preventDefault(); const el = e.currentTarget.elements.namedItem('scene') as HTMLInputElement; const v = el.value.trim(); if (v) { insertBlock(`柱：${v}`); el.value = '' } }}>
            <input name="scene" placeholder="＋ 新しい柱（場所・時間を入れて Enter）" aria-label="新しい柱" />
            <button type="submit" class="v21-btn">作る</button>
          </form>
          <div class="tl-scene-list tl-side-picks" onPointerDown={hold}>
            <For each={pillarPool()} fallback={<p class="tl-scene-none">まだ柱がありません。</p>}>
              {(tag) => <button type="button" onClick={() => insertBlock(`柱：${tag}`)}>{tag}</button>}
            </For>
          </div>
        </>
      }
    >
      <h3 class="tl-side-title">柱の候補</h3>
      <p class="tl-side-lead">{pillarQuery() ? `「${pillarQuery()}」を含む ${pillarMatches().length}件` : `今までの柱 ${pillarPool().length}件`}。押すと、いまの柱の行に入ります。</p>
      <div class="tl-scene-list tl-side-picks" onPointerDown={hold}>
        <For each={pillarMatches()} fallback={<p class="tl-scene-none">一致する柱がありません。このまま書けば、次から候補に出ます。</p>}>
          {(tag) => <button type="button" onClick={() => pickPillar(tag)}>{tag}</button>}
        </For>
      </div>
    </Show>
    </Show>
    </>
  )

  const WwPanel = () => <WwPanelView notebookId={isMemo() ? undefined : props.shelf} onPick={(name) => insertInline(name, false)} />

  const TagsPanel = () => (
    <>
      <h3 class="tl-side-title">共通tag</h3>
      <p class="tl-side-lead">押すと、カーソルの位置に貼ります。</p>
      <TagPicker onPick={insertTag} keepFocus />
    </>
  )

  // ---- スマホのサイドバー: ジャンルごとの縦のリスト ----
  const q = () => sheetQuery().trim().toLowerCase()
  const hit = (...texts: Array<string | undefined>) => !q() || texts.some((t) => (t ?? '').toLowerCase().includes(q()))
  /** 人物を押したとき: 空の行ならその人のセリフの行、文中なら名前だけを貼る（会話中に名前を呼ぶとき） */
  function pasteName(name: string) {
    if (!ta) return
    const cur = lineAt(ta.value, ta.selectionStart ?? ta.value.length)
    if (!cur.text.trim()) speak(name)
    else insertInline(name, false)
    closeSheet()
  }
  function pasteScene(tag: string) {
    if (pillarLine()) pickPillar(tag)
    else insertBlock(`柱：${tag}`)
    closeSheet()
  }
  const slotList = () => (isMemo() ? [] : castGroups()[0]?.cast ?? [])
  /** 検索窓の文字を、空いている枠に登場人物として足して、そのまま貼る */
  function addFromSearch() {
    const name = sheetQuery().trim()
    if (!name) return
    const problem = addCharacter(props.shelf, slotList(), name)
    if (problem) { setSheetError(problem); return }
    pasteName(name)
  }
  const memoCast = () => (isMemo() ? castGroups().flatMap((g) => g.cast.map((c) => ({ c, title: g.title }))) : [])
  async function saveRename(from: string, to: string) {
    const problem = await renameCharacterWithConfirm(props.shelf, slotList(), from, to)
    if (problem === 'cancelled') return
    if (problem) { setSheetError(problem); return }
    if (to.trim() !== from) renameInDrafts(from, to.trim())
    setSheetError('')
    setEditingName(null)
  }
  const allTags = createMemo(() => {
    const book = BOOKS[0]
    return book.prefixes.flatMap((p) => bookTags(book, p.group)).filter((t) => isTagShown(book.meta.id, t.id))
  })

  const MobileSheetView = (p: { id: MobileSheet }) => {
    const meta = MOBILE_SHEETS.find((m) => m.id === p.id)!
    return (
      <GenreSheet
        title={meta.title}
        query={sheetQuery()}
        onQuery={setSheetQuery}
        onClose={closeSheet}
        lead={
          p.id === 'cast' ? (isMemo() ? '押すと貼ります（空の行ならその人のセリフの行）。' : '押す＝貼る（空の行ならセリフの行）／長押し＝名前を変える／左へスワイプ＝消す／検索窓に名前を入れると、新しく足せます')
            : p.id === 'scenes' && !isMemo() && sceneView() === 'grid' ? 'マスを押すと [Scene_"名前"] を書きます。写真はギャラリーの「Sceneスロットに登録」から。'
            : p.id === 'scenes' ? (pillarLine() ? '押すと、いま書いている柱の行に入ります。検索窓に入れると新しい柱も作れます。' : '押すと、いまの行の下に柱を作ります。検索窓に入れると新しい柱も作れます。')
            : p.id === 'tags' ? '押すと、カーソルの位置に [タグ] で貼ります。'
            : undefined
        }
      >
        <Show when={sheetError()}><p class="v21-gsheet-error" role="alert">{sheetError()}</p></Show>

        <Show when={p.id === 'cast'}>
          <Show when={!isMemo() && sheetQuery().trim() && !slotList().some((c) => c.name === sheetQuery().trim())}>
            <button type="button" class="v21-gsheet-create" onPointerDown={hold} onClick={() => addFromSearch()}>＋「{sheetQuery().trim()}」を登場人物に足して貼る</button>
          </Show>
          <ul class="v21-gsheet-list">
            <Show when={hit(NARRATOR_NAME, 'ナレーション')}>
              <li><SwipeRow onTap={() => pasteName(NARRATOR_NAME)}><span class="v21-gs-no">0</span><span class="v21-gs-face">地</span><span class="v21-gs-name">ナレーション<small>全作品共通</small></span></SwipeRow></li>
            </Show>
            <For each={slotList()}>
              {(c, i) => (
                <Show when={hit(c.name, c.role)}>
                  <li>
                    <Show
                      when={editingName() === c.name}
                      fallback={
                        <SwipeRow
                          onTap={() => pasteName(c.name)}
                          onLongPress={() => { setSheetError(''); setEditingName(c.name) }}
                          onDelete={isDefaultSlotName(c.name, i()) ? undefined : () => clearCastSlot(props.shelf, slotList(), i())}
                          deleteLabel={`${c.name} を消す（${i() + 1}番を空きに戻す）`}
                          class={isDefaultSlotName(c.name, i()) ? 'is-empty' : ''}
                        >
                          <span class="v21-gs-no">{i() + 1}</span>
                          <Show when={c.portrait} fallback={<span class="v21-gs-face">{[...c.name][0] ?? '?'}</span>}>
                            <img class="v21-gs-face" src={c.portrait!} alt="" loading="lazy" style={{ 'object-position': `${c.focusX ?? '50%'} ${c.focusY ?? '15%'}` }} />
                          </Show>
                          <span class="v21-gs-name">{c.name}<small>{isDefaultSlotName(c.name, i()) ? '空き（長押しで名前を入れる）' : c.role}</small></span>
                        </SwipeRow>
                      }
                    >
                      <form class="v21-gs-edit" onSubmit={(e) => { e.preventDefault(); saveRename(c.name, (e.currentTarget.elements.namedItem('n') as HTMLInputElement).value) }}>
                        <span class="v21-gs-no">{i() + 1}</span>
                        <input name="n" value={c.name} aria-label="新しい名前" ref={(el) => requestAnimationFrame(() => { el.focus(); el.select() })} enterkeyhint="done" />
                        <button type="submit" class="v21-btn primary">変える</button>
                        <button type="button" class="v21-btn" onClick={() => { setEditingName(null); setSheetError('') }}>やめる</button>
                      </form>
                    </Show>
                  </li>
                </Show>
              )}
            </For>
            <For each={memoCast()}>
              {(x) => (
                <Show when={hit(x.c.name, x.c.role, x.title)}>
                  <li><SwipeRow onTap={() => pasteName(x.c.name)}><span class="v21-gs-face">{[...x.c.name][0] ?? '?'}</span><span class="v21-gs-name">{x.c.name}<small>{x.title}</small></span></SwipeRow></li>
                </Show>
              )}
            </For>
          </ul>
          <Show when={!isMemo()}><p class="v21-gsheet-foot">名前を変えると、作品の登場人物と全セリフ（下書きも）が変わります。</p></Show>
        </Show>

        <Show when={p.id === 'scenes'}><SceneViewTabs /></Show>
        <Show when={p.id === 'scenes' && !isMemo() && sceneView() === 'grid'}><Grid /></Show>
        <Show when={p.id === 'scenes' && (isMemo() || sceneView() === 'list')}>
          <Show when={sheetQuery().trim() && !pillarPool().includes(sheetQuery().trim())}>
            <button type="button" class="v21-gsheet-create" onPointerDown={hold} onClick={() => pasteScene(sheetQuery().trim())}>＋「{sheetQuery().trim()}」を新しい柱にする</button>
          </Show>
          <ul class="v21-gsheet-list">
            <For each={pillarPool().filter((t) => hit(t))} fallback={<li class="v21-gsheet-empty">{q() ? '見つかりません。' : 'まだ柱がありません。柱：場所 と書くと、次から候補に出ます。'}</li>}>
              {(tag) => <li><SwipeRow onTap={() => pasteScene(tag)}><span class="v21-gs-mark">柱</span><span class="v21-gs-name">{tag}</span></SwipeRow></li>}
            </For>
          </ul>
        </Show>

        <Show when={p.id === 'ww'}>
          <WwPanelView notebookId={isMemo() ? undefined : props.shelf} query={sheetQuery()} showTitle={false} onPick={(name) => { insertInline(name, false); closeSheet() }} />
        </Show>

        <Show when={p.id === 'tags'}>
          <ul class="v21-gsheet-list">
            <For each={allTags().filter((t) => hit(t.id, t.label)).slice(0, 200)} fallback={<li class="v21-gsheet-empty">見つかりません。</li>}>
              {(t) => <li><SwipeRow onTap={() => { insertTag(t.id); closeSheet() }}><span class="v21-gs-name"><code>[{t.id}]</code><small>{t.label}</small></span></SwipeRow></li>}
            </For>
          </ul>
        </Show>

        <Show when={p.id === 'sheets'}>
          <ul class="v21-gsheet-list">
            <For each={sheets().filter((d) => hit(sheetName(d), d.body))}>
              {(d) => <li><SwipeRow class={d.id === props.draftId ? 'is-here' : ''} onTap={() => { closeSheet(); openSheet(d.id) }}><span class="v21-gs-name">{sheetName(d)}<small>{d.id === props.draftId ? 'いま開いている' : ''}</small></span></SwipeRow></li>}
            </For>
          </ul>
          <button type="button" class="v21-btn v21-gsheet-new" onClick={newSheet}>＋ {isMemo() ? '新しいメモ' : '新しい下書き'}</button>
        </Show>
      </GenreSheet>
    )
  }

  const panelView = (p: DrawerTab) =>
    p === 'sheets' ? <SheetsPanel /> : p === 'cast' ? <CastPanel /> : p === 'scenes' ? <ScenesPanel /> : p === 'ww' ? <WwPanel /> : <TagsPanel />

  return (
    <div class="talklog v21-desk">
      <Show
        when={doc()}
        fallback={
          <div class="v21-desk-missing">
            <p>この{isMemo() ? 'メモ' : '下書き'}は見つかりません（別の端末で書いたか、消えています）。</p>
            <button type="button" class="v21-btn" onClick={goBack}>戻る</button>
          </div>
        }
      >
        {(d) => (
          <>
            <div class="v21-desk-head" classList={{ compact: !!props.embedded }}>
              <Show when={!props.embedded}>
                <button type="button" class="v21-back" onClick={goBack}>← {isMemo() ? 'アイディアメモ' : notebook()?.title || '作品'}</button>
              </Show>
              <input
                class="v21-desk-title"
                value={d().title}
                placeholder={isMemo() ? 'タイトル（無くてもよい）' : '下書きの名前'}
                aria-label="タイトル"
                onInput={(e) => updateDraft(props.shelf, d().id, { title: e.currentTarget.value })}
              />
              <Show when={!props.embedded}>
                <span class="v21-desk-where">{isMemo() ? 'どの作品にも属さないメモ' : '下書き（本番の場面とは別）'}・この端末だけに保存</span>
              </Show>
              {/* 下書きの種類（下書き→イベント・キャラクター・世界観へ変えていく）と、将来の記入テンプレート */}
              <Show when={!isMemo()}>
                <select
                  class="v21-desk-kind"
                  value={d().kind ?? 'draft'}
                  aria-label="下書きの種類"
                  title="この下書きの種類（書いているうちに変えていける）"
                  onChange={(e) => setDraftKind(props.shelf, d().id, e.currentTarget.value as DraftKind)}
                >
                  <For each={DRAFT_KINDS}>{(k) => <option value={k.id}>{k.label}</option>}</For>
                </select>
                <button
                  type="button"
                  class="v21-btn v21-desk-plot"
                  classList={{ on: plotOpen() }}
                  title="この下書きをプロットのフローチャートに付ける（画面は移りません）"
                  onClick={() => setPlotOpen(!plotOpen())}
                >
                  プロット<Show when={plotCount()}><small>{plotCount()}</small></Show>
                </button>
                <button type="button" class="v21-btn v21-desk-template" disabled title="記入テンプレート（準備中。種類の形ができたら、種類ごとに選べるようにする）">テンプレート</button>
              </Show>
              <Show when={!props.embedded && props.canSplit}>
                <button type="button" class="v21-btn v21-desk-split" onClick={() => props.onSplit?.()} title="横に2つ並べて書く（タブレットの横画面など）">2カラム</button>
              </Show>
              <Show when={isMemo() && props.embedded}>
                <select class="v21-desk-kind" value={d().status ?? 'seed'} aria-label="進捗" onChange={(e) => setMemoStatus(d().id, e.currentTarget.value as MemoStatus)}>
                  <For each={MEMO_STATUS}>{(st) => <option value={st.id}>{st.label}</option>}</For>
                </select>
              </Show>
              <Show when={isMemo() && !props.embedded}>
                <div class="v21-desk-status" role="radiogroup" aria-label="進捗">
                  <For each={MEMO_STATUS}>
                    {(s) => (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={(d().status ?? 'seed') === s.id}
                        classList={{ on: (d().status ?? 'seed') === s.id }}
                        title={s.hint}
                        onClick={() => setMemoStatus(d().id, s.id)}
                      >
                        {s.label}
                      </button>
                    )}
                  </For>
                </div>
                <Show when={daysLeft() !== null}>
                  <span class="v21-desk-due" title="作ってから10日のうちに進捗を変えないと、ごみ箱へ移ります（完全には消えません）">
                    あと{daysLeft()}日でごみ箱へ（進捗を変えると残ります）
                  </span>
                </Show>
                <button type="button" class="v21-icon-btn" title="ごみ箱へ（あとで戻せます）" onClick={toTrash}>🗑</button>
              </Show>
            </div>

            <div class="tl-body">
              <Show when={wide()}>
                <nav class="tl-rail left" aria-label="左のナビ">
                  <RailButton d={RAIL_ICONS.sheets} label="一覧" title={isMemo() ? 'メモ一覧' : '下書き一覧'} on={leftPanel() === 'sheets'} onClick={() => toggleLeft('sheets')} />
                  <RailButton d={RAIL_ICONS.cast} label="人物" title='登場人物（押す＝開く／長押し＝[Character_""] を入れる）' on={leftPanel() === 'cast'} onClick={() => toggleLeft('cast')} onLongPress={() => insertTemplate('cast')} />
                </nav>
                <Show when={leftPanel()}>
                  {(p) => <aside class="tl-side left">{panelView(p())}</aside>}
                </Show>
              </Show>

              <div class="tl-stage">
                <div class="v21-desk-sheet">
                  <textarea
                    ref={ta}
                    class="v21-desk-text"
                    value={d().body}
                    placeholder={'思いついたことを、そのまま書く\n\n柱：場所・時間\n名前：「セリフ」\n備考：メモ\n\n横のNAVの候補を押すと、カーソルの位置に入ります'}
                    onInput={(e) => { updateDraft(props.shelf, d().id, { body: e.currentTarget.value }); readCaret() }}
                    onKeyDown={onKeyDown}
                    onKeyUp={readCaret}
                    onClick={readCaret}
                    onFocus={readCaret}
                    onBlur={() => setLine(null)}
                  />
                </div>
              </div>

              {/* スマホ: 右隣の縦長NAV（ワンボタンでそのジャンルのサイドバーを開く） */}
              <Show when={!wide()}>
                <nav class="v21-mrail" aria-label="候補のNAV" onPointerDown={hold}>
                  <For each={MOBILE_SHEETS}>
                    {(m) => {
                      // 押す＝サイドバーを開く／0.6秒長押し＝直書きのタグ（2026-09-28 利用者: 一度逆にしたが、元に戻した）
                      const press = TEMPLATE_TAGS[m.id] ? holdPress(() => insertTemplate(m.id)) : null
                      return (
                      <button
                        type="button"
                        class="v21-mrail-btn"
                        classList={{ on: sheet() === m.id, hint: hintSheet() === m.id && sheet() !== m.id, sep: m.id === 'sheets' }}
                        aria-pressed={sheet() === m.id}
                        title={TEMPLATE_TAGS[m.id] ? `${m.title}（押す＝開く／長押し＝${TEMPLATE_TAGS[m.id]} を入れる）` : m.title}
                        {...(press?.handlers ?? {})}
                        onClick={() => {
                          if (press?.consumed()) return
                          openSheet2(m.id)
                        }}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={RAIL_ICONS[m.icon]} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        <span>{m.label}</span>
                      </button>
                      )
                    }}
                  </For>
                  <SymbolKeys />
                </nav>
              </Show>

              <Show when={wide()}>
                <Show when={rightPanel()}>
                  {(p) => <aside class="tl-side right">{panelView(p())}</aside>}
                </Show>
                <nav class="tl-rail right" aria-label="右のナビ">
                  <RailButton d={RAIL_ICONS.scenes} label="Scene" title='Scene一覧（押す＝開く／長押し＝[Scene_""] を入れる）' on={rightPanel() === 'scenes'} onClick={() => toggleRight('scenes')} onLongPress={() => insertTemplate('scenes')} />
                  <RailButton d={RAIL_ICONS.ww} label="WW" title="WW（アイテム・武器・スキル・用語）" on={rightPanel() === 'ww'} onClick={() => toggleRight('ww')} />
                  <RailButton d={RAIL_ICONS.tags} label="演出" title='共通tag（押す＝開く／長押し＝[演出_""] を入れる）' on={rightPanel() === 'tags'} onClick={() => toggleRight('tags')} onLongPress={() => insertTemplate('tags')} />
                  <SymbolKeys />
                </nav>
              </Show>
            </div>

            <Show when={!wide() && sheet()}>
              {(id) => <MobileSheetView id={id()} />}
            </Show>
            <Show when={plotOpen() && !isMemo()}>
              <PlotLinkPopover notebookId={props.shelf} draftId={props.draftId} draftTitle={d().title} onClose={() => setPlotOpen(false)} />
            </Show>
          </>
        )}
      </Show>
    </div>
  )
}

export default WritingDeskV21
