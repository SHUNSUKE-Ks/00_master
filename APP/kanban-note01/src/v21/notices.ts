import { createSignal } from 'solid-js'

// ホームの「お知らせ」。いろいろな所から届いたものを1つの板に並べる（2026-09-27 利用者）。
//   delivery … 届いた納品（public/deliveries/）
//   image    … 新しく入った画像（Gallery に最近足された画像）
//   device   … 他の端末からのお知らせ（まだ届く道が無い。KeyDeck の P-007 などで足す）
// 種類を足すときは NoticeKind と、NoticesPanel.tsx の集め方に1つ足す。

export type NoticeKind = 'delivery' | 'image' | 'device'
export const NOTICE_KIND_LABEL: Record<NoticeKind, string> = {
  delivery: '納品',
  image: '新しい画像',
  device: '他の端末',
}

/** 「新しい画像」として知らせる期間 */
export const NEW_IMAGE_DAYS = 7

// 閉じたお知らせ（この端末だけ）。中身が変われば id が変わるので、また出る
const SEEN_KEY = 'note-story-v21-notices-seen'
function readSeen(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') as string[] } catch { return [] }
}
const [seen, setSeen] = createSignal<string[]>(readSeen())

export const isNoticeSeen = (id: string) => seen().includes(id)

export function dismissNotice(id: string) {
  if (isNoticeSeen(id)) return
  const next = [...seen(), id].slice(-200)
  setSeen(next)
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(next)) } catch { /* 無視 */ }
}

export function restoreNotices() {
  setSeen([])
  try { localStorage.removeItem(SEEN_KEY) } catch { /* 無視 */ }
}

export const seenCount = () => seen().length
