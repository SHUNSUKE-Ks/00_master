import { createSignal } from 'solid-js'
import novelGameTagVol11 from './NovelGameTag_Vol1.1.json'

// タグ辞書の本棚。辞書は1冊＝1つのJSON（meta / prefixes / groups / example）。
// 増やすときは JSON を置いて BOOKS に1行足す。

export type TagBook = {
  meta: { id: string; title: string; volume: string; receivedNote?: string; design?: string }
  prefixes: Array<{ group: string; prefix: string; label: string; status: 'received' | 'partial' | 'missing' }>
  groups: Record<string, Record<string, string>>
  example?: unknown
}

export const BOOKS: TagBook[] = [novelGameTagVol11 as TagBook]

export function bookTags(book: TagBook, group: string) {
  return Object.entries(book.groups[group] ?? {}).map(([id, label]) => ({ id, label }))
}

export function bookSize(book: TagBook) {
  return Object.values(book.groups).reduce((sum, g) => sum + Object.keys(g).length, 0)
}

// ── 横の候補に出すタグ（全部は出せないので、編集画面で選ぶ）。端末ごとに保存 ──
// 保存するのは「隠したタグ」。辞書に後から足したタグは、最初から出る
const HIDDEN_KEY = 'note-story-v21-tag-hidden'
type HiddenMap = Record<string, string[]>

function readHidden(): HiddenMap {
  try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '{}') as HiddenMap } catch { return {} }
}
const [hidden, setHiddenSignal] = createSignal<HiddenMap>(readHidden())

export function isTagShown(bookId: string, tagId: string) {
  return !(hidden()[bookId] ?? []).includes(tagId)
}

export function setTagsShown(bookId: string, tagIds: string[], shown: boolean) {
  const current = new Set(hidden()[bookId] ?? [])
  for (const id of tagIds) {
    if (shown) current.delete(id)
    else current.add(id)
  }
  const next = { ...hidden(), [bookId]: [...current] }
  setHiddenSignal(next)
  try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(next)) } catch { /* 保存できなくても表示は変わる */ }
}
