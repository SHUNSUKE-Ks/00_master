import { addNotebook, deleteNotebook, setState, state, updateNotebook } from '../store'
import type { Notebook, NotebookPage, PageCharacter, WwEntry, WwKind } from '../types'
import { renameSpeaker } from '../utils/talkLog'
import { askConfirm, askForm } from './dialog'
import { CAST_SLOTS, castSlots, defaultSlotName, go, isDefaultSlotName, isNarratorName, isTitleNotebook, newPageId, newSlotId, scenePages } from './nav'

/** 新しいタイトル（アプリの中のダイアログで、名前とあらすじを聞く） */
export async function createTitle() {
  const values = await askForm({
    title: '新しいタイトル',
    message: '作品を作ります。第1場面と、登場人物の9つの枠（Character1〜9）が最初から入ります。',
    fields: [
      { name: 'title', label: 'タイトル名', placeholder: '例: はじまりの町の防衛線', required: true },
      { name: 'synopsis', label: 'あらすじ', placeholder: 'ひとこと・数行で（あとから作品ページで書き足せます）', multiline: true },
    ],
    okLabel: '作る',
  })
  const title = values?.title?.trim()
  if (!title) return
  const synopsis = values?.synopsis?.trim() ?? ''
  const now = new Date()
  const page: NotebookPage = { id: newPageId(), title: '第1場面', body: '', order: 0 }
  // 登場人物は最初から9つの枠（Character1〜9）で保存する（Alt+1〜9 がすぐ使える）
  const cast = Array.from({ length: CAST_SLOTS }, (_, i) => ({ id: newSlotId(i), name: defaultSlotName(i), dict: defaultSlotName(i), prompt: '', role: '', note: '' }))
  const id = await addNotebook({ title, storyOnly: true, pages: [page], cast, ...(synopsis ? { synopsis } : {}), createdAt: now, updatedAt: now })
  go({ name: 'title', notebookId: id })
}

export function addScene(nb: Notebook) {
  const pages = scenePages(nb)
  const page: NotebookPage = {
    id: newPageId(),
    title: `第${pages.length + 1}場面`,
    body: '',
    order: nb.pages.length,
  }
  updateNotebook(nb.id!, { pages: [...nb.pages, page], updatedAt: new Date() })
  return page
}

// 入力欄（タイトル名・あらすじ・登場人物）は打つたびに保存せず、画面だけ先に変えて800msまとめて保存する
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function patchNotebookSoon(id: string, patch: Partial<Omit<Notebook, 'id'>>) {
  setState('notebooks', (prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))
  clearTimeout(timers.get(id))
  timers.set(id, setTimeout(() => flushNotebook(id), 800))
}

export function flushNotebook(id: string) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  const nb = state.notebooks.find((n) => n.id === id)
  if (!nb) return
  const { id: _omit, ...rest } = nb
  updateNotebook(id, { ...rest, updatedAt: new Date() })
}

// ── 登場人物の追加・名前の変更（会話ログ・執筆デスクのサイドバーから。作品ページの編集と同じ nb.cast に保存） ──
export function castId(name: string, index: number) {
  const slug = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_぀-ヿ㐀-鿿]/g, '')
  return slug ? `char_${slug}` : `char_${index + 1}`
}

const withIds = (list: PageCharacter[]) => list.map((c, i) => ({ ...c, id: c.id || castId(c.name, i) }))

/** 名前として使えるか。使えないときは理由を返す */
export function castNameProblem(name: string, current: string[], except?: string) {
  const v = name.trim()
  if (!v) return '名前を入れてください'
  if (isNarratorName(v)) return 'ナレーションは全作品共通なので、登場人物には足せません（Alt+0）'
  if (/[：:「」\n]/.test(v)) return '名前に ： 「 」 は使えません'
  if (v !== except && current.includes(v)) return `「${v}」はもういます`
  return ''
}

/** 作品の登場人物を9つの枠にそろえて保存する（未保存・9人未満の作品を開いたとき）。変えたら true */
export function ensureCastSlots(nbId: string, extraNames: string[] = []): boolean {
  const nb = state.notebooks.find((n) => n.id === nbId)
  if (!nb) return false
  const slots = castSlots(nb, extraNames)
  const cur = nb.cast ?? []
  if (cur.length === slots.length && cur.every((c, i) => c.name === slots[i].name)) return false
  patchNotebookSoon(nbId, { cast: withIds(slots) })
  return true
}

/** 登場人物を1人足す＝空いている枠（Character番号のまま）のいちばん前に名前を入れる。セリフは付け替えない */
export function addCharacter(nbId: string, base: PageCharacter[], name: string): string {
  const v = name.trim()
  const problem = castNameProblem(v, base.map((c) => c.name))
  if (problem) return problem
  const slots = base.length >= CAST_SLOTS ? base.slice(0, CAST_SLOTS) : [...base, ...Array.from({ length: CAST_SLOTS - base.length }, (_, k) => ({ id: newSlotId(base.length + k), name: defaultSlotName(base.length + k), dict: '', prompt: '', role: '', note: '' }))]
  const free = slots.findIndex((c, i) => isDefaultSlotName(c.name, i))
  if (free < 0) return `9つの枠がうまっています（作品ページの × で空きにできます）`
  patchNotebookSoon(nbId, { cast: withIds(slots.map((c, i) => (i === free ? { ...c, name: v, dict: v } : c))) })
  return ''
}

/** 枠を空きにする（Character番号の名前に戻す）。今あるセリフの名前はそのまま残す */
export function clearCastSlot(nbId: string, base: PageCharacter[], index: number) {
  const name = defaultSlotName(index)
  patchNotebookSoon(nbId, { cast: withIds(base.map((c, i) => (i === index ? { id: `${newSlotId(i)}_${Date.now().toString(36)}`, name, dict: name, prompt: '', role: '', note: '' } : c))) })
}

/** 枠の並びを入れ替える（番号＝Alt+番号 が変わる） */
export function moveCastSlot(nbId: string, base: PageCharacter[], index: number, step: number) {
  const target = index + step
  if (target < 0 || target >= base.length) return
  const next = [...base]
  ;[next[index], next[target]] = [next[target], next[index]]
  patchNotebookSoon(nbId, { cast: withIds(next) })
}

/** 名前を変える。作品の全場面のセリフ（本文と会話ログの各欄）も新しい名前に付け替える */
/**
 * 名前を変える。作品の全場面のセリフ（本文と会話ログの各欄）も新しい名前に付け替える。
 * 新しい名前が別の枠の人物と同じとき（既存の名前にする）は、allowMerge なら2人をまとめる:
 * 元の人物のセリフを新しい名前に付け替え、元の枠は空き（Character番号）に戻す。
 */
export function renameCharacter(nbId: string, base: PageCharacter[], from: string, to: string, opts: { allowMerge?: boolean } = {}): string {
  const v = to.trim()
  if (v === from) return ''
  const names = base.map((c) => c.name)
  const fromIndex = names.indexOf(from)
  // 枠に無い名前（例: 登録前のセリフの CharacterA）を、枠にいる人物の名前にする＝その人物のセリフにまとめる（登録は変えない）
  const intoUnregistered = fromIndex < 0 && names.includes(v)
  // 枠にいる人物どうし: 確認のうえでまとめる
  const mergeSlots = fromIndex >= 0 && names.includes(v) && !!opts.allowMerge && !!v && !isNarratorName(v)
  const problem = intoUnregistered || mergeSlots ? '' : castNameProblem(v, names, from)
  if (problem) return problem
  const nb = state.notebooks.find((n) => n.id === nbId)
  if (!nb) return '作品が見つかりません'
  const pages = nb.pages.map((p) => {
    const body = renameSpeaker(p.body ?? '', from, v)
    const logs = p.scenarioLogs
      ? Object.fromEntries(Object.entries(p.scenarioLogs).map(([k, t]) => [k, renameSpeaker(t, from, v)]))
      : p.scenarioLogs
    return { ...p, body, ...(logs ? { scenarioLogs: logs } : {}) }
  })
  const cast = mergeSlots
    ? withIds(base.map((c, i) => (i === fromIndex ? { id: `${newSlotId(i)}_${Date.now().toString(36)}`, name: defaultSlotName(i), dict: defaultSlotName(i), prompt: '', role: '', note: '' } : c)))
    : withIds(base.map((c) => (c.name === from ? { ...c, name: v, dict: !c.dict || c.dict === from ? v : c.dict } : c)))
  patchNotebookSoon(nbId, { pages, cast })
  return ''
}

/** 既存の別の人物の名前にしようとしているか（まとめる確認が要るか） */
export function renameNeedsMerge(base: PageCharacter[], from: string, to: string) {
  const names = base.map((c) => c.name)
  const v = to.trim()
  return !!v && v !== from && names.includes(from) && names.includes(v)
}

/** 画面から名前を変えるとき用: 既存の名前にするなら確認してからまとめる。やめたら 'cancelled' */
export async function renameCharacterWithConfirm(nbId: string, base: PageCharacter[], from: string, to: string): Promise<string> {
  if (renameNeedsMerge(base, from, to)) {
    const ok = await askConfirm({
      title: `「${to.trim()}」はもういます`,
      message: `「${from}」のセリフを「${to.trim()}」にまとめて、「${from}」の枠は空き（Character番号）に戻します。`,
      okLabel: 'まとめる',
    })
    if (!ok) return 'cancelled'
    return renameCharacter(nbId, base, from, to, { allowMerge: true })
  }
  return renameCharacter(nbId, base, from, to)
}

// ── WW（World Word）: アイテム・武器・スキル・用語を作品ごとに登録（2026-09-28） ──
export const WW_KINDS: Array<{ id: WwKind; label: string }> = [
  { id: 'item', label: 'アイテム' },
  { id: 'weapon', label: '武器' },
  { id: 'skill', label: 'スキル' },
  { id: 'term', label: '用語' },
]
export const wwKindLabel = (k: WwKind) => WW_KINDS.find((x) => x.id === k)?.label ?? k

/** 1件足す。同じ種類に同じ名前があれば断る（理由を返す） */
export function addWw(nbId: string, kind: WwKind, name: string, dict = ''): string {
  const v = name.trim()
  if (!v) return '名前を入れてください'
  const nb = state.notebooks.find((n) => n.id === nbId)
  if (!nb) return '作品が見つかりません'
  const list = nb.ww ?? []
  if (list.some((e) => e.kind === kind && e.name === v)) return `「${v}」は${wwKindLabel(kind)}にもうあります`
  const entry: WwEntry = { id: `ww_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, kind, name: v, ...(dict.trim() ? { dict: dict.trim() } : {}) }
  patchNotebookSoon(nbId, { ww: [...list, entry] })
  return ''
}
export function removeWw(nbId: string, id: string) {
  const nb = state.notebooks.find((n) => n.id === nbId)
  if (!nb) return
  patchNotebookSoon(nbId, { ww: (nb.ww ?? []).filter((e) => e.id !== id) })
}

// ── Event（イベント）とごみ箱（2026-09-28） ───────────────────────────────
/** 新しいイベント。中身は作品ページと同じ（第1場面・9つの枠）。Title を選ぶと Title タグが付く */
export async function createEvent(preset: { titleId?: string } = {}) {
  const titles = state.notebooks.filter(isTitleNotebook)
  const values = await askForm({
    title: '新しいイベント',
    message: 'イベントを作ります。中身は作品ページと同じ（場面・登場人物・下書き・プロット）。Title と登場人物のタグは、あとからイベントのページで付けられます。',
    fields: [
      { name: 'title', label: 'イベント名', placeholder: '例: 村の門で兵士と話す', required: true },
      { name: 'synopsis', label: 'Dict（説明）', placeholder: 'どんな出来事か、ひとこと・数行で', multiline: true },
      ...(titles.length ? [{ name: 'titleId', label: 'Title', value: preset.titleId ?? '', options: [{ value: '', label: '（まだ付けない）' }, ...titles.map((t) => ({ value: t.id!, label: t.title || '無題' }))] }] : []),
    ],
    okLabel: '作る',
  })
  const title = values?.title?.trim()
  if (!title) return null
  const synopsis = values?.synopsis?.trim() ?? ''
  const titleId = values?.titleId ?? ''
  const now = new Date()
  const page: NotebookPage = { id: newPageId(), title: '第1場面', body: '', order: 0 }
  const cast = Array.from({ length: CAST_SLOTS }, (_, i) => ({ id: newSlotId(i), name: defaultSlotName(i), dict: defaultSlotName(i), prompt: '', role: '', note: '' }))
  const id = await addNotebook({
    title, kind: 'event', storyOnly: true, pages: [page], cast,
    titleIds: titleId ? [titleId] : [], characterRefs: [],
    ...(synopsis ? { synopsis } : {}), createdAt: now, updatedAt: now,
  })
  go({ name: 'title', notebookId: id })
  return id
}

export function setEventTags(id: string, patch: { titleIds?: string[]; characterRefs?: string[] }) {
  patchNotebookSoon(id, patch)
}

/** ごみ箱へ（一覧から消える。戻せる） */
export function trashNotebooks(ids: string[]) {
  const at = new Date().toISOString()
  for (const id of ids) { patchNotebookSoon(id, { trashedAt: at }); flushNotebook(id) }
}
export function restoreNotebook(id: string) {
  const nb = state.notebooks.find((n) => n.id === id)
  if (!nb) return
  const { id: _omit, trashedAt: _t, ...rest } = nb
  setState('notebooks', (prev) => prev.map((n) => (n.id === id ? { ...rest, id } : n)))
  // Firestore の項目を消すため、空の値ではなく null で上書きする
  updateNotebook(id, { ...rest, trashedAt: null as unknown as undefined, updatedAt: new Date() })
}
/** 完全に消す（クラウドからも。元に戻せない） */
export async function purgeNotebook(id: string) {
  await deleteNotebook(id)
}

// ── 非表示（アーカイブ）と並べ替え（2026-09-28。一覧の「編集」から） ─────────────
/** 非表示にする（一覧・会話ログなどに出さない。「非表示」から見られ、戻せる） */
export function archiveNotebooks(ids: string[]) {
  const at = new Date().toISOString()
  for (const id of ids) { patchNotebookSoon(id, { archivedAt: at }); flushNotebook(id) }
}
export function unarchiveNotebook(id: string) {
  const nb = state.notebooks.find((n) => n.id === id)
  if (!nb) return
  const { id: _omit, archivedAt: _a, ...rest } = nb
  setState('notebooks', (prev) => prev.map((n) => (n.id === id ? { ...rest, id } : n)))
  updateNotebook(id, { ...rest, archivedAt: null as unknown as undefined, updatedAt: new Date() })
}
/** 一覧の並べ替え: いま見えている並び（ids）の中で、id を step だけ動かし、全員に番号を振り直す */
export function moveInList(ids: string[], id: string, step: number) {
  const list = [...ids]
  const i = list.indexOf(id)
  const j = i + step
  if (i < 0 || j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j], list[i]]
  list.forEach((nid, index) => {
    const nb = state.notebooks.find((n) => n.id === nid)
    // 並べ替えは「変更」に数えない（更新日時を変えない。最新の変更ログに出さない）
    if (nb && nb.listOrder !== index) updateNotebook(nid, { listOrder: index })
  })
}
