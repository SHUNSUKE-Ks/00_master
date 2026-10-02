import { createSignal } from 'solid-js'

// 下書き（仮置き）と、どの作品にも属さないアイディアメモ。
// **本番の場面（notebook.pages）とは別の置き場**に持ち、混ざらないようにする。
// いまは端末の localStorage だけ（別の端末には出ない）。置き場を変えるときは、このファイルだけを直す。
//
// 棚（shelf）の鍵: 作品の下書き＝作品の notebookId、アイディアメモ＝ MEMO_SHELF。
// 作成日時・更新日時は画面には出さないが、必ず持つ（createdAt / updatedAt）。

/** アイディアメモの進捗 */
export type MemoStatus = 'seed' | 'growing' | 'use' | 'shelved'
export const MEMO_STATUS: Array<{ id: MemoStatus; label: string; hint: string }> = [
  { id: 'seed', label: '種', hint: '思いついたまま' },
  { id: 'growing', label: '育てる', hint: '膨らませている' },
  { id: 'use', label: '使う', hint: '作品に入れる予定' },
  { id: 'shelved', label: '寝かせる', hint: 'いつか使うかも' },
]
export const memoStatusLabel = (s?: MemoStatus) => MEMO_STATUS.find((x) => x.id === (s ?? 'seed'))!.label

/**
 * 作品の下書きの種類。書いているうちに「イベント」「キャラクター詳細」などへ変えていける（2026-09-28 利用者）。
 * 種類が固まったら、種類ごとの記入テンプレートを選べるようにする（いまはボタンだけ）。
 */
export type DraftKind = 'draft' | 'event' | 'character' | 'world'
export const DRAFT_KINDS: Array<{ id: DraftKind; label: string; hint: string }> = [
  { id: 'draft', label: '下書き', hint: 'まだ決めていない' },
  { id: 'event', label: 'イベント', hint: '場面・出来事（イベント名を決めていく）' },
  { id: 'character', label: 'キャラクター', hint: '人物の詳細' },
  { id: 'world', label: '世界観', hint: 'WW（世界観の用語・設定）' },
]
export const draftKindLabel = (k?: DraftKind) => DRAFT_KINDS.find((x) => x.id === (k ?? 'draft'))!.label

export type Draft = {
  id: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
  // ↓ 作品の下書きだけが使う
  kind?: DraftKind
  kindUpdatedAt?: string
  // ↓ アイディアメモだけが使う
  status?: MemoStatus
  /** 進捗を最後に変えた日時。一度でも変えたメモは、自動ではごみ箱へ行かない */
  statusUpdatedAt?: string
  /** ごみ箱へ移した日時（完全には消さない） */
  trashedAt?: string
  trashReason?: 'expired' | 'manual'
  /** ごみ箱から戻した日時。戻した日から、また猶予を数える */
  restoredAt?: string
}
type DraftShelf = Record<string, Draft[]>

const KEY = 'note-story-v21-drafts'
export const MEMO_SHELF = '__memos__'
/** 作ってから（戻してから）この日数のうちに進捗を変えなければ、ごみ箱へ */
export const MEMO_GRACE_DAYS = 10
const DAY_MS = 24 * 60 * 60 * 1000

function read(): DraftShelf {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') as DraftShelf } catch { return {} }
}

const [shelf, setShelf] = createSignal<DraftShelf>(read())
let saveTimer: ReturnType<typeof setTimeout> | undefined

function commit(next: DraftShelf, immediate = false) {
  setShelf(next)
  clearTimeout(saveTimer)
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(shelf())) } catch { /* 容量不足など */ } }
  if (immediate) write()
  else saveTimer = setTimeout(write, 500)
}

export function flushDrafts() {
  clearTimeout(saveTimer)
  try { localStorage.setItem(KEY, JSON.stringify(shelf())) } catch { /* 無視 */ }
}

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

// ── 作品の下書き ─────────────────────────────────────────────────────────
export function draftsOf(shelfKey: string): Draft[] {
  return shelf()[shelfKey] ?? []
}

export function findDraft(shelfKey: string, id: string): Draft | undefined {
  return draftsOf(shelfKey).find((d) => d.id === id)
}

export function addDraft(notebookId: string): Draft {
  const now = new Date().toISOString()
  const list = draftsOf(notebookId)
  const draft: Draft = { id: newId('draft'), title: `下書き${list.length + 1}`, body: '', createdAt: now, updatedAt: now }
  commit({ ...shelf(), [notebookId]: [...list, draft] }, true)
  return draft
}

export function updateDraft(shelfKey: string, id: string, patch: Partial<Pick<Draft, 'title' | 'body'>>) {
  patchDraft(shelfKey, id, { ...patch, updatedAt: new Date().toISOString() })
}

function patchDraft(shelfKey: string, id: string, patch: Partial<Draft>, immediate = false) {
  const list = draftsOf(shelfKey).map((d) => (d.id === id ? { ...d, ...patch } : d))
  commit({ ...shelf(), [shelfKey]: list }, immediate)
}

export function setDraftKind(shelfKey: string, id: string, kind: DraftKind) {
  const now = new Date().toISOString()
  patchDraft(shelfKey, id, { kind, kindUpdatedAt: now, updatedAt: now }, true)
}

export function deleteDraft(notebookId: string, id: string) {
  commit({ ...shelf(), [notebookId]: draftsOf(notebookId).filter((d) => d.id !== id) }, true)
}

// ── アイディアメモ（どの作品にも属さない） ────────────────────────────────
export const allMemos = () => draftsOf(MEMO_SHELF)
export const liveMemos = () => allMemos().filter((m) => !m.trashedAt)
export const trashedMemos = () => allMemos().filter((m) => m.trashedAt)

export function addMemo(): Draft {
  const now = new Date().toISOString()
  const memo: Draft = { id: newId('memo'), title: '', body: '', createdAt: now, updatedAt: now, status: 'seed' }
  commit({ ...shelf(), [MEMO_SHELF]: [...allMemos(), memo] }, true)
  return memo
}

export function setMemoStatus(id: string, status: MemoStatus) {
  const now = new Date().toISOString()
  patchDraft(MEMO_SHELF, id, { status, statusUpdatedAt: now, updatedAt: now }, true)
}

export function trashMemo(id: string, reason: 'expired' | 'manual' = 'manual', at = new Date()) {
  patchDraft(MEMO_SHELF, id, { trashedAt: at.toISOString(), trashReason: reason }, true)
}

export function restoreMemo(id: string) {
  patchDraft(MEMO_SHELF, id, { trashedAt: undefined, trashReason: undefined, restoredAt: new Date().toISOString() }, true)
}

/** ごみ箱へ行く期限（ミリ秒）。進捗を一度でも変えたメモは期限なし（null） */
export function memoDeadline(m: Draft): number | null {
  if (m.statusUpdatedAt) return null
  const base = Math.max(Date.parse(m.createdAt) || 0, Date.parse(m.restoredAt ?? '') || 0)
  return base + MEMO_GRACE_DAYS * DAY_MS
}

/** ごみ箱までの残り日数（切り上げ）。期限の無いメモは null */
export function memoDaysLeft(m: Draft, now = Date.now()): number | null {
  const deadline = memoDeadline(m)
  if (deadline === null) return null
  return Math.max(0, Math.ceil((deadline - now) / DAY_MS))
}

/** 期限を過ぎたメモをごみ箱へ移す（完全には消さない）。移した件数を返す */
export function sweepMemos(now = Date.now()): number {
  let moved = 0
  const at = new Date(now).toISOString()
  const list = allMemos().map((m) => {
    const deadline = memoDeadline(m)
    if (m.trashedAt || deadline === null || deadline > now) return m
    moved += 1
    return { ...m, trashedAt: at, trashReason: 'expired' as const }
  })
  if (moved) commit({ ...shelf(), [MEMO_SHELF]: list }, true)
  return moved
}
