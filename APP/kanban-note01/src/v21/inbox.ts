import { addNotebook, state, updateNotebook } from '../store'
import type { Notebook, NotebookPage, PageCharacter } from '../types'
import { CAST_SLOTS, defaultSlotName, isDefaultSlotName, newPageId, newSlotId, scenePages } from './nav'

// 受信箱（2026-09-28 利用者: 外（CC など）からシナリオを足すとき、Kanban Note に反映するための入口）。
// 置き場: public/inbox/index.json（一覧）と public/inbox/<packageId>.json（中身）。デプロイすると「最新の変更ログ」に出て、押すと取り込む。
// 形式: note_story_scenario v0.1（docs/受信箱_シナリオ納品フォーマット_v0.1.md が正本）
// - mode "newEvent":     Title（名前で合わせる）の下に、新しいイベントを作る
// - mode "appendScenes": Title か、その Title のイベント（名前で合わせる）に場面を足す
// 外の人はアプリの中の ID を知らないので、名前で合わせる。同じ packageId は二度取り込まない（inboxIds）。

export type InboxIndexItem = { packageId: string; title: string; summary?: string; path: string; receivedAt?: string; from?: string }

export type ScenarioPackage = {
  meta: { format: string; version: string; packageId: string; title: string; from?: string; createdAt?: string }
  mode: 'newEvent' | 'appendScenes'
  target: { title: string; event?: string }
  event?: { title: string; synopsis?: string; characters?: string[] }
  cast?: Array<{ name: string; role?: string }>
  scenes: Array<{ title: string; body: string }>
}

export async function loadInboxIndex(): Promise<InboxIndexItem[]> {
  try {
    const res = await fetch('/inbox/index.json', { cache: 'no-store' })
    if (!res.ok) return []
    const body = await res.json()
    return Array.isArray(body.items) ? body.items : []
  } catch {
    return []
  }
}

export async function loadScenario(path: string): Promise<ScenarioPackage> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`受信箱のファイルを読めません（${res.status}）`)
  return checkScenario(await res.json())
}

/** 形のチェック（足りない・違うときは理由を返す） */
export function checkScenario(pkg: unknown): ScenarioPackage {
  const p = pkg as ScenarioPackage
  if (p?.meta?.format !== 'note_story_scenario') throw new Error('形式が違います（note_story_scenario ではありません）')
  if (!p.meta.packageId) throw new Error('meta.packageId がありません')
  if (p.mode !== 'newEvent' && p.mode !== 'appendScenes') throw new Error('mode は newEvent か appendScenes')
  if (!p.target?.title) throw new Error('target.title（どの Title か）がありません')
  if (p.mode === 'newEvent' && !p.event?.title) throw new Error('newEvent には event.title が要ります')
  if (!Array.isArray(p.scenes) || !p.scenes.length) throw new Error('scenes が空です')
  return p
}

/** その packageId を取り込んだノート（無ければ undefined） */
export function importedFromInbox(packageId: string): Notebook | undefined {
  return state.notebooks.find((n) => n.inboxIds?.includes(packageId) && !n.trashedAt)
}

const findTitle = (name: string) =>
  state.notebooks.find((n) => n.kind !== 'event' && !n.trashedAt && n.title.trim() === name.trim())
const findEvent = (titleId: string, name: string) =>
  state.notebooks.find((n) => n.kind === 'event' && !n.trashedAt && n.title.trim() === name.trim() && n.titleIds?.includes(titleId))

/** 取り込む。取り込んだ先（または作ったイベント）の ID を返す */
export async function importScenario(pkg: ScenarioPackage): Promise<string> {
  const done = importedFromInbox(pkg.meta.packageId)
  if (done?.id) return done.id
  const title = findTitle(pkg.target.title)
  if (!title?.id) throw new Error(`Title「${pkg.target.title}」が見つかりません（名前を合わせてください）`)
  const now = new Date()

  if (pkg.mode === 'newEvent') {
    // 並び: event.characters の順（主な人）→ cast にだけいる人
    const names = [...new Set([...(pkg.event?.characters ?? []), ...(pkg.cast ?? []).map((c) => c.name)].map((n) => n.trim()).filter(Boolean))]
    const cast: PageCharacter[] = Array.from({ length: CAST_SLOTS }, (_, i) => {
      const name = names[i] ?? defaultSlotName(i)
      const role = (pkg.cast ?? []).find((c) => c.name === name)?.role ?? ''
      return { id: newSlotId(i), name, dict: name, prompt: '', role, note: '' }
    })
    // Character タグ: Title の登場人物と同じ名前の人
    const characterRefs = (title.cast ?? []).filter((c) => names.includes(c.name)).map((c) => `${title.id}:${c.id}`)
    const pages: NotebookPage[] = pkg.scenes.map((s, i) => ({ id: newPageId() + i, title: s.title || `第${i + 1}場面`, body: s.body ?? '', order: i }))
    return addNotebook({
      title: pkg.event!.title, kind: 'event', storyOnly: true, pages, cast,
      titleIds: [title.id], characterRefs, inboxIds: [pkg.meta.packageId],
      ...(pkg.event?.synopsis ? { synopsis: pkg.event.synopsis } : {}),
      createdAt: now, updatedAt: now,
    })
  }

  // appendScenes: イベント名があればそのイベント、無ければ Title に足す
  const target = pkg.target.event ? findEvent(title.id, pkg.target.event) : title
  if (!target?.id) throw new Error(`Title「${title.title}」のイベント「${pkg.target.event}」が見つかりません`)
  const start = target.pages.length
  const added: NotebookPage[] = pkg.scenes.map((s, i) => ({ id: newPageId() + i, title: s.title || `第${scenePages(target).length + i + 1}場面`, body: s.body ?? '', order: start + i }))
  // 新しい話者は空いている枠に入れる（今の名前は変えない）
  const cast = [...(target.cast ?? [])]
  for (const c of pkg.cast ?? []) {
    if (cast.some((x) => x.name === c.name)) continue
    const i = cast.findIndex((x, idx) => isDefaultSlotName(x.name, idx))
    if (i >= 0) cast[i] = { ...cast[i], name: c.name, dict: c.name, role: c.role ?? '' }
  }
  updateNotebook(target.id, { pages: [...target.pages, ...added], cast, inboxIds: [...(target.inboxIds ?? []), pkg.meta.packageId], updatedAt: now })
  return target.id
}
