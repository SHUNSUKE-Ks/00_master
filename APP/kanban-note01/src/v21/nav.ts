import { createSignal } from 'solid-js'
import type { Notebook, NotebookPage, PageCharacter } from '../types'
import { countDialogueLines } from '../utils/talkLog'

// ── 版の切り替え（V2.1 が既定。Vol1.1 は凍結した旧画面。V3.1 は化けるNote＝シンプルなメモ帳） ──
export type AppVersion = 'v31' | 'v21' | 'v11'
const VERSION_KEY = 'note-story-app-version'
const ROUTE_KEY = 'note-story-v21-route'

function readVersion(): AppVersion {
  try {
    const v = localStorage.getItem(VERSION_KEY)
    return v === 'v11' || v === 'v31' ? v : 'v21'
  } catch {
    return 'v21'
  }
}

/** 起動時に1回だけ読む。切り替えは再読み込みで反映する（画面の状態を持ち越さない） */
export const appVersion: AppVersion = readVersion()

export function switchAppVersion(next: AppVersion) {
  try {
    localStorage.setItem(VERSION_KEY, next)
    sessionStorage.removeItem(ROUTE_KEY)
  } catch { /* 保存できなくても再読み込みはする */ }
  location.reload()
}

// ── V2.1 の画面遷移 ────────────────────────────────────────────────────────
export type V21Route =
  | { name: 'home' }
  | { name: 'titles' }
  /** イベント一覧（2026-09-28。Title タグ・Character タグ付きのカード） */
  | { name: 'events' }
  | { name: 'title'; notebookId: string }
  | { name: 'talk'; notebookId?: string; pageId?: string }
  | { name: 'gallery' }
  | { name: 'memos' }
  | { name: 'settings' }
  /** 執筆デスク（下書き・アイディアメモを書く画面）。shelf＝作品の notebookId か MEMO_SHELF */
  | { name: 'desk'; shelf: string; draftId: string }

function readRoute(): V21Route {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ROUTE_KEY) || 'null')
    if (saved && typeof saved.name === 'string') return saved as V21Route
  } catch { /* 読めなければホーム */ }
  // 起動したときの画面はタイトル一覧（2026-09-28 利用者: ホームからタイトルに変更）
  return { name: 'titles' }
}

const [route, setRouteSignal] = createSignal<V21Route>(readRoute())
export { route }

export function go(next: V21Route) {
  setRouteSignal(next)
  try { sessionStorage.setItem(ROUTE_KEY, JSON.stringify(next)) } catch { /* 無視 */ }
  if (next.name === 'title') recordAccess(`title:${next.notebookId}`)
}

// ── よく開く（端末ごと。localStorage に回数と最終時刻を持つ） ─────────────────
const ACCESS_KEY = 'note-story-v21-access'
type AccessLog = Record<string, { count: number; last: string }>

const [accessLog, setAccessLog] = createSignal<AccessLog>(readAccess())
export { accessLog }

function readAccess(): AccessLog {
  try {
    return JSON.parse(localStorage.getItem(ACCESS_KEY) || '{}') as AccessLog
  } catch {
    return {}
  }
}

export function recordAccess(key: string) {
  const next = { ...accessLog() }
  next[key] = { count: (next[key]?.count ?? 0) + 1, last: new Date().toISOString() }
  setAccessLog(next)
  try { localStorage.setItem(ACCESS_KEY, JSON.stringify(next)) } catch { /* 無視 */ }
}

// ── 作品（タイトル）の見方 ─────────────────────────────────────────────────
/** 作品ではないノート（素材置き場・受信箱・設定・コメント） */
const NON_TITLE_IDS = new Set(['story-ideas', 'story-inbox', 'story-settings', 'story-comments'])
const SYSTEM_PAGE_IDS = new Set(['inbox-tag-db', 'inbox-archive'])

/** 書く対象のノート（Title と Event。ごみ箱・非表示の物は除く） */
export function isStoryNotebook(nb: Notebook) {
  return Boolean(nb.id) && !NON_TITLE_IDS.has(nb.id!) && nb.title !== 'InBox' && !nb.trashedAt && !nb.archivedAt
}
/** Title（作品）。種類の無い物は Title（今までの作品はすべて Title） */
export function isTitleNotebook(nb: Notebook) {
  return isStoryNotebook(nb) && nb.kind !== 'event'
}
/** Event（イベント） */
export function isEventNotebook(nb: Notebook) {
  return isStoryNotebook(nb) && nb.kind === 'event'
}
/** ごみ箱の中（system のノートは除く） */
export function isTrashedNotebook(nb: Notebook) {
  return Boolean(nb.id) && !NON_TITLE_IDS.has(nb.id!) && !!nb.trashedAt
}
/** 非表示（アーカイブ）。ごみ箱の物は除く */
export function isArchivedNotebook(nb: Notebook) {
  return Boolean(nb.id) && !NON_TITLE_IDS.has(nb.id!) && !!nb.archivedAt && !nb.trashedAt
}
/** 一覧の並び: 編集で並べ替えた順（listOrder）→ 無い物は更新の新しい順 */
export function byListOrder(a: Notebook, b: Notebook) {
  const oa = a.listOrder ?? Number.POSITIVE_INFINITY
  const ob = b.listOrder ?? Number.POSITIVE_INFINITY
  if (oa !== ob) return oa < ob ? -1 : 1
  return updatedTime(b) - updatedTime(a)
}

export function scenePages(nb: Notebook): NotebookPage[] {
  return [...nb.pages].filter((p) => !SYSTEM_PAGE_IDS.has(p.id)).sort((a, b) => a.order - b.order)
}

export function pageTalkCount(p: NotebookPage) {
  return countDialogueLines(p.body ?? '') + Object.values(p.scenarioLogs ?? {}).reduce((sum, t) => sum + countDialogueLines(t), 0)
}

export function titleTalkCount(nb: Notebook) {
  return scenePages(nb).reduce((sum, p) => sum + pageTalkCount(p), 0)
}

const DIALOGUE_LINE = /^(.+?)\s*：「(.*?)」?\s*$/

/** ページ本文から最後の会話を n 行（名前・セリフ）取り出す */
export function lastDialogues(p: NotebookPage, n = 2): Array<{ name: string; text: string }> {
  const out: Array<{ name: string; text: string }> = []
  for (const line of (p.body ?? '').split('\n')) {
    const m = line.match(DIALOGUE_LINE)
    if (m) out.push({ name: m[1].trim(), text: m[2] })
  }
  return out.slice(-n)
}

/** あらすじ。無ければ最初の場面の本文から、見出し・会話・書式以外の最初の文を拾う */
export function titleSynopsis(nb: Notebook) {
  if (nb.synopsis?.trim()) return nb.synopsis.trim()
  const first = scenePages(nb)[0]
  const line = (first?.body ?? '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !/^(#|\||-|:::|柱|ト[：:])/.test(l) && !DIALOGUE_LINE.test(l))
  return line ?? ''
}

// ── ナレーション（地の文）: 全作品共通。名前は出さず、Alt+0 で呼ぶ。番号つきの登場人物には数えない ──
export const NARRATOR_NAME = 'ナレーション'
const NARRATOR_NAMES = new Set(['ナレーション', 'ナレーター', '地の文'])
export function isNarratorName(name: string) {
  return NARRATOR_NAMES.has(name.trim())
}

/** 作品の登場人物: 作品の cast → 各場面の characters（重複を除く）。ナレーションは含めない */
export function titleCast(nb: Notebook): PageCharacter[] {
  if (nb.cast?.length) return nb.cast.filter((c) => !isNarratorName(c.name))
  const seen = new Set<string>()
  const out: PageCharacter[] = []
  for (const p of scenePages(nb)) {
    for (const c of p.characters ?? []) {
      const name = c.name.trim()
      if (!name || seen.has(name) || isNarratorName(name)) continue
      seen.add(name)
      out.push(c)
    }
  }
  return out
}

// ── 登場人物の9つの枠（2026-09-27 利用者: 名前は作品のDB＝nb.cast で一元管理） ──────────────
// どの作品も Alt+1〜9 に対応する9つの枠を持つ。初期の名前は Character1〜Character9。
// 名前を変えると、作品の登場人物・全場面のセリフ・サイドバー・作品ページが一緒に変わる（actions.ts の renameCharacter）。
// 枠の id は名前を変えても変わらない（画像の付帯JSONなどは id で結ぶ）。
export const CAST_SLOTS = 9
export const defaultSlotName = (index: number) => `Character${index + 1}`
export const isDefaultSlotName = (name: string, index: number) => name.trim() === defaultSlotName(index)
export const newSlotId = (index: number) => `slot_${index + 1}`

const slotChar = (name: string, id: string): PageCharacter => ({ id, name, dict: name, prompt: '', role: '', note: '' })

/**
 * 作品の9つの枠。登録済みの人物 →（未登録なら）場面の人物とセリフに出てくる名前 → Character番号 で埋める。
 * extraNames: いま開いている会話ログに出てくる名前（未登録の作品で、今あるセリフの名前を枠に残すため）
 */
export function castSlots(nb: Notebook, extraNames: string[] = []): PageCharacter[] {
  const slots = titleCast(nb).slice(0, CAST_SLOTS)
  if (!nb.cast?.length) {
    const seen = new Set(slots.map((c) => c.name.trim()))
    // 未登録の作品: 全場面のセリフに出てくる名前（場面の順）→ いま開いている会話ログの名前
    const spoken: string[] = []
    for (const p of scenePages(nb)) {
      for (const line of (p.body ?? '').split('\n')) {
        const m = line.match(DIALOGUE_LINE)
        if (m) spoken.push(m[1])
      }
    }
    for (const raw of [...spoken, ...extraNames]) {
      const name = raw.trim()
      if (!name || name === '名前' || seen.has(name) || isNarratorName(name) || slots.length >= CAST_SLOTS) continue
      seen.add(name)
      slots.push(slotChar(name, newSlotId(slots.length)))
    }
  }
  while (slots.length < CAST_SLOTS) slots.push(slotChar(defaultSlotName(slots.length), newSlotId(slots.length)))
  return slots
}

/** どの作品にも属さない（Title なし）ときの9つの枠。作品の Character1〜9 と区別して CharacterA〜CharacterI（2026-09-30 利用者） */
export const untitledSlotName = (index: number) => `Character${String.fromCharCode(65 + index)}`
export const defaultCastSlots = (): PageCharacter[] =>
  Array.from({ length: CAST_SLOTS }, (_, i) => slotChar(untitledSlotName(i), newSlotId(i)))

/** Character番号のままではない（名前が入っている）人物。人数の表示などに使う */
export function namedCast(nb: Notebook): PageCharacter[] {
  return titleCast(nb).filter((c, i) => !isDefaultSlotName(c.name, i))
}

export function updatedTime(nb: Notebook) {
  const t = nb.updatedAt instanceof Date ? nb.updatedAt.getTime() : new Date(nb.updatedAt as unknown as string).getTime()
  return Number.isFinite(t) ? t : 0
}

/** 表紙が無い作品の色（タイトル名から決める。毎回同じ色になる） */
export function coverGradient(seed: string) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360
  return `linear-gradient(135deg, hsl(${h} 38% 26%), hsl(${(h + 40) % 360} 30% 12%))`
}

export function newPageId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
