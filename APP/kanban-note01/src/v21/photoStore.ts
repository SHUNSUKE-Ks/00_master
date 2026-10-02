import { firebaseEnabled } from '../db/firebase'
import { saveGalleryItemMeta, syncGalleryItemToFirebase } from '../dataBridge/firebaseGallery'
import { galleryState, refreshGalleryFromCloud, setGalleryState, updateGalleryItem } from '../pages/gallery/store'
import type { GalleryComment, GalleryItem } from '../pages/gallery/types'

// V2.1 のギャラリー（2026-09-28 利用者）。前のギャラリー（src/pages/gallery）の入れ物（galleryState）とクラウド連携はそのまま使い、
// 写真の入れ方と情報の持ち方を V2.1 に合わせる:
// - 端末から写真を入れる → 大きすぎる写真は縮める → この端末（IndexedDB）に置く → クラウド（Firebase Storage＋Firestore の JSON）へ送る
//   ※前のギャラリーは写真を localStorage（約5MB）に文字で置いていたので、スマホの写真が数枚で入らなくなっていた
// - 写真ごとに JSON（クラウドの galleryAssets の1件）を持ち、作品（titleIds）・登場人物（characterRefs）・タグ・小さなコメントを入れる
// - 情報を変えたら、この端末に覚え、クラウドにも書く（PC など他の端末から見られる）

const META_KEY = 'note-story-v21-gallery-meta'   // 写真ごとの情報（画像は入れない）
const DB_NAME = 'note-story-v21-gallery'          // 画像（縮めた dataURL）を置く IndexedDB
const MAX_EDGE = 2048
const JPEG_QUALITY = 0.86

type Meta = Partial<Pick<GalleryItem, 'label' | 'tags' | 'titleIds' | 'characterRefs' | 'comments' | 'isFavorite' | 'isDeleted' | 'device'>> & { updatedAt: string }
type MetaStore = Record<string, Meta>
type LocalRecord = Omit<GalleryItem, 'createdAt' | 'updatedAt' | 'dataUrl'> & { createdAt: string; updatedAt: string }
const V21_ITEMS_KEY = 'note-story-v21-gallery-items' // この端末で入れた写真の情報（画像は IndexedDB）

export function deviceName(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? 'android' : 'android-tablet'
  if (/iPad|iPhone/i.test(ua)) return 'ios'
  return 'pc'
}

// ── この端末の保存 ─────────────────────────────────────────────
function readJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback }
}
function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* 容量不足など */ }
}
function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') { resolve(null); return }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore('images')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
}
async function idbPut(id: string, dataUrl: string) {
  const db = await openDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    const tx = db.transaction('images', 'readwrite')
    tx.objectStore('images').put(dataUrl, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
}
async function idbGet(id: string): Promise<string | undefined> {
  const db = await openDb()
  if (!db) return undefined
  return new Promise((resolve) => {
    const req = db.transaction('images').objectStore('images').get(id)
    req.onsuccess = () => resolve(req.result as string | undefined)
    req.onerror = () => resolve(undefined)
  })
}

function saveLocalRecords() {
  const mine = galleryState.items.filter((i) => i.id.startsWith('g21_'))
  const records: LocalRecord[] = mine.map(({ dataUrl: _d, createdAt, updatedAt, ...rest }) => ({ ...rest, createdAt: new Date(createdAt).toISOString(), updatedAt: new Date(updatedAt).toISOString() }))
  writeJson(V21_ITEMS_KEY, records)
}
function rememberMeta(id: string, meta: Omit<Meta, 'updatedAt'>) {
  const all = readJson<MetaStore>(META_KEY, {})
  all[id] = { ...(all[id] ?? {}), ...meta, updatedAt: new Date().toISOString() }
  writeJson(META_KEY, all)
}

/** この端末で直した情報のうち、入れ物（クラウドから来た物を含む）より新しい物を重ねる */
function applyLocalMeta() {
  const metas = readJson<MetaStore>(META_KEY, {})
  for (const [id, meta] of Object.entries(metas)) {
    const cur = galleryState.items.find((i) => i.id === id)
    if (cur && Date.parse(meta.updatedAt) >= new Date(cur.updatedAt).getTime()) {
      const { updatedAt, ...rest } = meta
      updateGalleryItem(id, { ...rest, updatedAt: new Date(updatedAt) })
    }
  }
}

/** クラウドから読み直す（他の端末で入れた・直した写真を見る）。読めた件数を返す。クラウドを使っていなければ 0 */
export async function refreshFromCloud(): Promise<number> {
  if (!firebaseEnabled) return 0
  const n = await refreshGalleryFromCloud()
  applyLocalMeta()
  return n
}

/** 起動時: この端末で入れた写真と、覚えている情報を入れ物に戻す（クラウドから来た物にも情報を重ねる） */
let hydrated = false
export async function hydrateV21Gallery() {
  if (hydrated) return
  hydrated = true
  const records = readJson<LocalRecord[]>(V21_ITEMS_KEY, [])
  const have = new Set(galleryState.items.map((i) => i.id))
  const add: GalleryItem[] = records.filter((r) => !have.has(r.id)).map((r) => ({ ...r, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) }))
  if (add.length) setGalleryState('items', (prev) => [...add, ...prev])
  applyLocalMeta()
  // 画像は IndexedDB から（クラウドの URL が無い物だけ）
  for (const r of records) {
    const cur = galleryState.items.find((i) => i.id === r.id)
    if (cur && !cur.dataUrl && !cur.downloadUrl) {
      const dataUrl = await idbGet(r.id)
      if (dataUrl) updateGalleryItem(r.id, { dataUrl })
    }
  }
}

// ── 写真を入れる ───────────────────────────────────────────────
function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result ?? ''))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    // 読めない形式（PC の HEIC など）で待ち続けないよう、8 秒で諦めてそのまま入れる
    const timer = setTimeout(() => resolve(null), 8000)
    img.onload = () => { clearTimeout(timer); resolve(img) }
    img.onerror = () => { clearTimeout(timer); resolve(null) }
    img.src = src
  })
}
/** 大きすぎる写真は長い辺 2048px の JPEG に縮める（縮められない環境ではそのまま） */
async function prepare(file: File): Promise<{ file: File; dataUrl: string; width?: number; height?: number }> {
  const original = await readAsDataUrl(file)
  const img = await loadImage(original)
  if (!img || !img.naturalWidth) return { file, dataUrl: original }
  const w = img.naturalWidth
  const h = img.naturalHeight
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h))
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) return { file, dataUrl: original, width: w, height: h }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return { file, dataUrl: original, width: w, height: h }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY))
  if (!blob) return { file, dataUrl: original, width: w, height: h }
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return { file: new File([blob], name, { type: 'image/jpeg' }), dataUrl: await readAsDataUrl(blob), width: canvas.width, height: canvas.height }
}

/** 写真を入れる（いくつでも）。作品・登場人物をあらかじめ付けられる。入れた写真の id を返す */
export async function addPhotosV21(files: File[], preset: { titleIds?: string[]; characterRefs?: string[] } = {}): Promise<string[]> {
  const ids: string[] = []
  for (const raw of files) {
    if (!raw.type.startsWith('image/')) continue
    const p = await prepare(raw)
    const now = new Date()
    const id = `g21_${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 7)}`
    const item: GalleryItem = {
      id,
      filename: p.file.name,
      label: raw.name.replace(/\.[^.]+$/, ''),
      tags: [],
      category: 'reference',
      mimeType: p.file.type,
      fileSize: p.file.size,
      width: p.width,
      height: p.height,
      dataUrl: p.dataUrl,
      isFavorite: false,
      syncStatus: firebaseEnabled ? 'queued' : 'disabled',
      assetStatus: 'localDraft',
      titleIds: preset.titleIds ?? [],
      characterRefs: preset.characterRefs ?? [],
      comments: [],
      device: deviceName(),
      createdAt: now,
      updatedAt: now,
    }
    setGalleryState('items', (prev) => [item, ...prev])
    await idbPut(id, p.dataUrl)
    saveLocalRecords()
    ids.push(id)
    if (firebaseEnabled) void sendToCloud(id, p.file)
  }
  return ids
}

/** クラウドへ送る（画像と JSON）。失敗しても写真はこの端末に残る */
export async function sendToCloud(id: string, file?: File) {
  const item = galleryState.items.find((i) => i.id === id)
  if (!item || !firebaseEnabled) return
  let upload = file
  if (!upload && !item.storagePath && item.dataUrl) {
    const blob = await (await fetch(item.dataUrl)).blob()
    upload = new File([blob], item.filename, { type: item.mimeType })
  }
  updateGalleryItem(id, { syncStatus: 'syncing', lastSyncAttemptAt: new Date().toISOString() })
  try {
    const asset = await syncGalleryItemToFirebase(item, upload)
    updateGalleryItem(id, {
      storagePath: asset.storagePath ?? undefined,
      downloadUrl: asset.downloadUrl ?? undefined,
      url: asset.downloadUrl ?? undefined,
      syncStatus: 'synced',
      assetStatus: asset.assetStatus,
      syncError: undefined,
      syncedAt: asset.sync.syncedAt ?? undefined,
    })
  } catch (e) {
    updateGalleryItem(id, { syncStatus: 'error', syncError: e instanceof Error ? e.message : String(e) })
  }
  saveLocalRecords()
}

// ── 情報を変える（この端末に覚え、クラウドにも書く） ───────────────────────
const cloudTimers = new Map<string, ReturnType<typeof setTimeout>>()
export function updatePhoto(id: string, patch: Omit<Meta, 'updatedAt'>) {
  updateGalleryItem(id, { ...patch, updatedAt: new Date() })
  rememberMeta(id, patch)
  if (id.startsWith('g21_')) saveLocalRecords()
  const item = galleryState.items.find((i) => i.id === id)
  if (!firebaseEnabled || !item?.storagePath) return
  clearTimeout(cloudTimers.get(id))
  cloudTimers.set(id, setTimeout(() => {
    const latest = galleryState.items.find((i) => i.id === id)
    if (latest) saveGalleryItemMeta(latest).catch((e) => updateGalleryItem(id, { syncError: e instanceof Error ? e.message : String(e) }))
  }, 800))
}

export function toggleIn(list: string[] | undefined, value: string): string[] {
  const cur = list ?? []
  return cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value]
}

export function addComment(id: string, text: string) {
  const t = text.trim()
  if (!t) return
  const item = galleryState.items.find((i) => i.id === id)
  const comment: GalleryComment = { id: `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, text: t, createdAt: new Date().toISOString(), device: deviceName() }
  updatePhoto(id, { comments: [...(item?.comments ?? []), comment] })
}
export function removeComment(id: string, commentId: string) {
  const item = galleryState.items.find((i) => i.id === id)
  updatePhoto(id, { comments: (item?.comments ?? []).filter((c) => c.id !== commentId) })
}

/** 写真の JSON（クラウドに置く形の要点）。確かめる・写す用 */
export function photoJson(item: GalleryItem) {
  return {
    id: item.id,
    label: item.label,
    filename: item.filename,
    mimeType: item.mimeType,
    width: item.width ?? null,
    height: item.height ?? null,
    tags: item.tags,
    titleIds: item.titleIds ?? [],
    characterRefs: item.characterRefs ?? [],
    comments: item.comments ?? [],
    favorite: item.isFavorite,
    deleted: !!item.isDeleted,
    device: item.device ?? null,
    storagePath: item.storagePath ?? null,
    downloadUrl: item.downloadUrl ?? null,
    syncStatus: item.syncStatus ?? null,
    createdAt: new Date(item.createdAt).toISOString(),
    updatedAt: new Date(item.updatedAt).toISOString(),
  }
}

export const imageOf = (item: GalleryItem) => item.thumbnailUrl ?? item.downloadUrl ?? item.url ?? item.dataUrl ?? ''
