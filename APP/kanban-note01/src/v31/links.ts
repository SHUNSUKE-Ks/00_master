// リンク（2026-10-03 利用者）。
// ・アプリ内リンク（メンション）: 本文の中に `[[p:ページID]]` と書く。表示する名前は、そのページのいまの名前（名前を変えてもリンクは切れない）
// ・外部リンクのカード（ブックマーク）: 1行の `::link {JSON}`。表と同じ「1行ぶんの部品」

export const REF_RE = /\[\[p:([\w-]+)\]\]/g
export const refToken = (pageId: string) => `[[p:${pageId}]]`

/** 文の中のリンクを、名前に置き換える（検索の抜き出し・テキストの書き出し用） */
export function resolveRefs(text: string, nameOf: (id: string) => string | null, fmt: (name: string, id: string) => string = (n) => `@${n}`) {
  return text.replace(REF_RE, (_m, id: string) => fmt(nameOf(id) ?? '（消えたページ）', id))
}

// ---- 外部リンクのカード ----
export type LinkCard = {
  /** URL */
  u: string
  /** タイトル・説明・サイト名 */
  t: string
  d: string
  s: string
  /** 画像。`bnimg:ID`（端末に保存した写真）か `https://…`（YouTube のサムネイルなど） */
  img?: string
  /** 自分用のメモ */
  memo?: string
}

const PREFIX = '::link '
export const isLinkLine = (text: string) => text.startsWith(PREFIX)
export function parseLink(text: string): LinkCard | null {
  if (!isLinkLine(text)) return null
  try {
    const c = JSON.parse(text.slice(PREFIX.length)) as LinkCard
    return typeof c.u === 'string' ? { u: c.u, t: c.t ?? '', d: c.d ?? '', s: c.s ?? '', img: c.img, memo: c.memo } : null
  } catch {
    return null
  }
}
export const linkLine = (c: LinkCard) => PREFIX + JSON.stringify(c)

/** 1つの URL だけか（貼り付けたらカードにする） */
export function asUrl(text: string): URL | null {
  const t = text.trim()
  if (!/^https?:\/\/\S+$/i.test(t)) return null
  try { return new URL(t) } catch { return null }
}
export const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u } }

/** YouTube の動画 ID（サムネイルはサーバー無しで出せる） */
export function youtubeId(u: string): string | null {
  try {
    const url = new URL(u)
    if (url.hostname === 'youtu.be') return url.pathname.slice(1) || null
    if (/(^|\.)youtube\.com$/.test(url.hostname)) return url.searchParams.get('v') ?? url.pathname.match(/\/(?:shorts|embed|live)\/([\w-]+)/)?.[1] ?? null
  } catch { /* URL でない */ }
  return null
}

// ---- 自動取得（サーバーの受付窓口 /api/link-preview。送るのは URL だけ） ----
export type Preview = { url: string; title: string; description: string; image: string; site: string }
export async function fetchPreview(u: string): Promise<Preview> {
  const r = await fetch(`/api/link-preview?url=${encodeURIComponent(u)}`)
  const j = await r.json().catch(() => ({ error: '取得できませんでした' }))
  if (!r.ok) throw new Error(j.error ?? '取得できませんでした')
  return j as Preview
}
/** カードの画像（窓口を通して受け取り、端末で縮めて保存する） */
export async function fetchPreviewImage(imageUrl: string): Promise<Blob> {
  const r = await fetch(`/api/link-preview?image=${encodeURIComponent(imageUrl)}`)
  if (!r.ok) throw new Error('画像を取れませんでした')
  return r.blob()
}
/** まだ手で直していない（自動で埋めてよい）タイトルか */
export const isPlaceholderTitle = (c: LinkCard) => !c.t || c.t === hostOf(c.u) || c.t === 'YouTube の動画'

/** URL から最初のカードを作る（自動取得が返るまでの仮。分かる所だけ埋める） */
export function cardFromUrl(u: string): LinkCard {
  const host = hostOf(u)
  const yt = youtubeId(u)
  return {
    u,
    t: yt ? 'YouTube の動画' : host,
    d: '',
    s: yt ? 'YouTube' : host,
    img: yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : undefined,
  }
}
