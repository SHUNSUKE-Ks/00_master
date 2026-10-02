import { state } from '../store'
import type { ImageOrder, Notebook, SceneSlot } from '../types'
import { patchNotebookSoon } from './actions'
import { isStoryNotebook } from './nav'

// Sceneスロット（2026-09-28 利用者）。作品ごとに、ギャラリーの写真を Scene として並べる。
// - 9つで1パレット。下書きの Scene サイドバーの「9グリッド」に出し、テンキー 1〜9 で [Scene_"名前"] を本文に書く。− ＋ でパレットを替える
// - 写真の無いスロット（ラベルだけ）は絵の発注。テンキー 0 で置き、発注リストに 名前・作品・納品先 を書く
// - 絵ができたら、ギャラリーの写真から「Sceneスロットに登録」で納品する（photoId が入り、発注は納品済みになる）
// スロットは作品（Notebook）に持つので、作品と一緒にクラウドへ保存される。

export const PALETTE_SIZE = 9

/** カメラアングル（画像を頼むときに共有する。プロンプト辞書ができるまでの仮の候補） */
export const CAMERA_ANGLES = ['', '正面', 'あおり（下から）', '俯瞰（上から）', '真横', '背面', 'アップ', '引き（全景）'] as const

const newId = () => `ss_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const findNb = (nbId: string) => state.notebooks.find((n) => n.id === nbId)

export const slotsOf = (nb?: Notebook) => nb?.sceneSlots ?? []
/** パレットの数（最後のパレットが埋まっていても、次に置く所が見えるよう1つ多くはしない。最低1） */
export const paletteCount = (nb?: Notebook) => Math.max(1, Math.ceil(slotsOf(nb).length / PALETTE_SIZE))
/** パレット p（0始まり）の9マス。空きは null */
export function paletteCells(nb: Notebook | undefined, p: number): Array<SceneSlot | null> {
  const list = slotsOf(nb).slice(p * PALETTE_SIZE, (p + 1) * PALETTE_SIZE)
  return Array.from({ length: PALETTE_SIZE }, (_, i) => list[i] ?? null)
}
/** スロットの場所（パレット・番号、どちらも1始まり） */
export function slotPlace(nb: Notebook | undefined, slotId: string) {
  const i = slotsOf(nb).findIndex((s) => s.id === slotId)
  return i < 0 ? null : { palette: Math.floor(i / PALETTE_SIZE) + 1, cell: (i % PALETTE_SIZE) + 1 }
}
const placeLabel = (nb: Notebook, index: number) =>
  `${nb.title || '無題'}／Sceneスロット パレット${Math.floor(index / PALETTE_SIZE) + 1}・${(index % PALETTE_SIZE) + 1}番`

/** 本文に書くタグ */
export const sceneTag = (title: string) => `[Scene_"${title}"]`

function save(nbId: string, slots: SceneSlot[]) {
  patchNotebookSoon(nbId, { sceneSlots: slots })
}

/** 写真を新しいスロットとして登録する。エラーの文を返す（無ければ ''） */
export function addPhotoSlot(nbId: string, title: string, photoId: string): string {
  const nb = findNb(nbId)
  const v = title.trim()
  if (!nb) return '作品が見つかりません'
  if (!v) return 'Scene の名前を入れてください'
  if (slotsOf(nb).some((s) => s.photoId === photoId && s.title === v)) return `「${v}」はもうこの写真で登録してあります`
  save(nbId, [...slotsOf(nb), { id: newId(), title: v, photoId, createdAt: new Date().toISOString() }])
  return ''
}

/** ラベルだけのスロット（絵の発注）を置く。置いたスロットを返す */
export function addOrderSlot(nbId: string, title: string, note = ''): SceneSlot | null {
  const nb = findNb(nbId)
  const v = title.trim()
  if (!nb || !v) return null
  const index = slotsOf(nb).length
  const order: ImageOrder = { deliverTo: placeLabel(nb, index), agent: 'codex', status: 'open', requestedAt: new Date().toISOString(), ...(note.trim() ? { note: note.trim() } : {}) }
  const slot: SceneSlot = { id: newId(), title: v, order, createdAt: new Date().toISOString() }
  save(nbId, [...slotsOf(nb), slot])
  return slot
}

/** 発注中（または空いた）スロットへ写真を納品する */
export function deliverPhoto(nbId: string, slotId: string, photoId: string) {
  const nb = findNb(nbId)
  if (!nb) return
  save(nbId, slotsOf(nb).map((s) => (s.id !== slotId ? s : {
    ...s, photoId,
    ...(s.order ? { order: { ...s.order, status: 'delivered' as const, deliveredAt: new Date().toISOString() } } : {}),
  })))
}

/** 写真を外す。発注から来たスロットは発注に戻し、写真から作ったスロットは消す */
export function detachPhoto(nbId: string, slotId: string) {
  const nb = findNb(nbId)
  if (!nb) return
  save(nbId, slotsOf(nb).flatMap((s) => {
    if (s.id !== slotId) return [s]
    if (!s.order) return []
    const { photoId: _p, ...rest } = s
    const { deliveredAt: _d, ...order } = s.order
    return [{ ...rest, order: { ...order, status: 'open' as const } }]
  }))
}

export function removeSlot(nbId: string, slotId: string) {
  const nb = findNb(nbId)
  if (!nb) return
  save(nbId, slotsOf(nb).filter((s) => s.id !== slotId))
}

export function updateOrder(nbId: string, slotId: string, patch: Partial<Pick<ImageOrder, 'note' | 'agent' | 'camera'>>) {
  const nb = findNb(nbId)
  if (!nb) return
  save(nbId, slotsOf(nb).map((s) => (s.id === slotId && s.order ? { ...s, order: { ...s.order, ...patch } } : s)))
}

/** 1つ前・後ろへ動かす（パレットの並び＝テンキーの番号） */
export function moveSlot(nbId: string, slotId: string, step: number) {
  const nb = findNb(nbId)
  if (!nb) return
  const list = [...slotsOf(nb)]
  const i = list.findIndex((s) => s.id === slotId)
  const j = i + step
  if (i < 0 || j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j], list[i]]
  save(nbId, list)
}

export type SlotRow = { nb: Notebook; slot: SceneSlot; index: number }
const allRows = (): SlotRow[] =>
  state.notebooks.filter(isStoryNotebook).flatMap((nb) => slotsOf(nb).map((slot, index) => ({ nb, slot, index })))

/** 発注リスト（まだ絵の無い発注）。古い順 */
export const openOrders = () =>
  allRows().filter((r) => r.slot.order?.status === 'open' && !r.slot.photoId).sort((a, b) => a.slot.order!.requestedAt.localeCompare(b.slot.order!.requestedAt))
/** この写真が入っているスロット */
export const slotsWithPhoto = (photoId: string) => allRows().filter((r) => r.slot.photoId === photoId)

/** 発注リストの JSON（画像を作る担当へ渡す。納品先はパレットの番号が動くと変わるので、いまの場所で書き直す） */
export function orderListJson() {
  return {
    schema: 'note_story.image_order.v0.1',
    createdAt: new Date().toISOString(),
    items: openOrders().map(({ nb, slot, index }) => ({
      id: slot.id,
      name: slot.title,
      titleId: nb.id,
      title: nb.title,
      deliverTo: placeLabel(nb, index),
      note: slot.order?.note ?? '',
      agent: slot.order?.agent ?? '',
      camera: slot.order?.camera ?? '',
      requestedAt: slot.order?.requestedAt,
    })),
  }
}
export const deliverToOf = (r: SlotRow) => placeLabel(r.nb, r.index)
