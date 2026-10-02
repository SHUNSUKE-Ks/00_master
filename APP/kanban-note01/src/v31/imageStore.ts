import Dexie, { type Table } from 'dexie'

// 表のセルに入れる写真。localStorage（5MB ほど）には入らないので IndexedDB に置く（この端末だけ）。
// 本文には `![](bnimg:ID)` とだけ書く。長辺 1600px に縮め、webp（使えなければ jpeg）にしてから保存する。

type ImageRow = { id: string; blob: Blob; w: number; h: number; createdAt: string }

class ImageDb extends Dexie {
  images!: Table<ImageRow, string>
  constructor() {
    super('bakeru-note-v31-images')
    this.version(1).stores({ images: 'id' })
  }
}
const idb = new ImageDb()

export const IMG_TOKEN = /^!\[[^\]]*\]\(bnimg:([\w-]+)\)$/
export const imgToken = (id: string) => `![](bnimg:${id})`

const MAX_EDGE = 1600
const urls = new Map<string, string>()

async function shrink(file: Blob): Promise<{ blob: Blob; w: number; h: number }> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * k)
  const h = Math.round(bmp.height * k)
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  cv.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  const blob = await new Promise<Blob | null>((res) => cv.toBlob(res, 'image/webp', 0.86))
  if (blob && blob.type === 'image/webp') return { blob, w, h }
  const jpg = await new Promise<Blob | null>((res) => cv.toBlob(res, 'image/jpeg', 0.88))
  return { blob: jpg ?? file, w, h }
}

/** 写真を縮めて保存し、id を返す */
export async function putImage(file: Blob): Promise<string> {
  const { blob, w, h } = await shrink(file)
  const id = `im${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  await idb.images.put({ id, blob, w, h, createdAt: new Date().toISOString() })
  urls.set(id, URL.createObjectURL(blob))
  return id
}

/** 表示用の URL（無ければ null） */
export async function imageUrl(id: string): Promise<string | null> {
  const hit = urls.get(id)
  if (hit) return hit
  const row = await idb.images.get(id)
  if (!row) return null
  const url = URL.createObjectURL(row.blob)
  urls.set(id, url)
  return url
}

/** 書き出し用（data: URL） */
export async function imageDataUrl(id: string): Promise<string | null> {
  const row = await idb.images.get(id)
  if (!row) return null
  return new Promise((res) => {
    const fr = new FileReader()
    fr.onload = () => res(String(fr.result))
    fr.onerror = () => res(null)
    fr.readAsDataURL(row.blob)
  })
}

export const isImageFile = (f: File) => /^image\//.test(f.type)
