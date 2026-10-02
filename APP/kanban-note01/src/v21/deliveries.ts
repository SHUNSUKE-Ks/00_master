import { addNotebook, state } from '../store'
import type { Notebook, NotebookPage, PageCharacter } from '../types'
import { newPageId } from './nav'

// 納品パッケージ（public/deliveries/）。別の制作チャットが作った物語・立ち絵・素材を、作品として取り込む。
// 形式 note_story_delivery v0.1（novelengine_content_delivery_package の meta に項目名をそろえた）

export type DeliveryIndexItem = { packageId: string; title: string; subtitle?: string; cover?: string; path: string; /** 届いた日（お知らせの並びに使う） */ deliveredAt?: string }

export type DeliveryPackage = {
  meta: { format: string; version: string; packageId: string; title: string; subtitle?: string; source?: Record<string, string> }
  synopsis?: string
  cover?: string
  cast: Array<{ id: string; name: string; role?: string; portrait?: string; focusX?: string; focusY?: string }>
  images: NonNullable<Notebook['assets']>
  scenes: Array<{ id: string; title: string; background?: string; body: string }>
}

export async function loadDeliveryIndex(): Promise<DeliveryIndexItem[]> {
  try {
    const res = await fetch('/deliveries/index.json', { cache: 'no-store' })
    if (!res.ok) return []
    const body = await res.json()
    return Array.isArray(body.deliveries) ? body.deliveries : []
  } catch {
    return []
  }
}

export async function loadDelivery(path: string): Promise<DeliveryPackage> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`納品ファイルを読めません（${res.status}）`)
  const pkg = (await res.json()) as DeliveryPackage
  if (pkg.meta?.format !== 'note_story_delivery') throw new Error('形式が違います（note_story_delivery ではありません）')
  return pkg
}

export function importedNotebook(packageId: string) {
  return state.notebooks.find((n) => n.deliveryId === packageId)
}

/** 作品（notebook）として取り込む。本文・人物・素材はそのまま写す */
export async function importDelivery(pkg: DeliveryPackage): Promise<string> {
  const existing = importedNotebook(pkg.meta.packageId)
  if (existing?.id) return existing.id
  const now = new Date()
  const pages: NotebookPage[] = pkg.scenes.map((s, i) => ({ id: newPageId() + i, title: s.title, body: s.body, order: i }))
  const cast: PageCharacter[] = pkg.cast.map((c) => ({
    id: c.id,
    name: c.name,
    dict: c.name,
    prompt: '',
    role: c.role ?? '',
    note: '',
    ...(c.portrait ? { portrait: c.portrait } : {}),
    ...(c.focusX ? { focusX: c.focusX } : {}),
    ...(c.focusY ? { focusY: c.focusY } : {}),
  }))
  return addNotebook({
    title: pkg.meta.title,
    subtitle: pkg.meta.subtitle,
    synopsis: pkg.synopsis,
    cover: pkg.cover,
    storyOnly: true,
    deliveryId: pkg.meta.packageId,
    cast,
    assets: pkg.images,
    pages,
    createdAt: now,
    updatedAt: now,
  })
}
