import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

// Bakeru Note のリンクカード用の受付窓口（2026-10-03 利用者）。Vercel の Function。
//   GET /api/link-preview?url=…   → そのページの「名刺」（タイトル・説明・画像・サイト名）だけを JSON で返す
//   GET /api/link-preview?image=… → カード用の画像そのものを返す（ブラウザから直接は読めないため。端末で縮めて保存する）
// 何も保存しない。ノートの中身は受け取らない（受け取るのは URL だけ）。
// 安全のための決まり:
//   ・http/https だけ。ポートは 80/443 だけ
//   ・行き先が内側のアドレス（127.x・10.x・192.168.x・169.254.x・::1 など）なら断る。転送（リダイレクト）も1回ずつ確かめる（最大3回）
//   ・待つのは 6 秒まで。HTML は頭の 512KB まで、画像は 4MB まで
//   ・このアプリ（kanban-note01 の本番・プレビュー・手元）からの呼び出しだけ受ける

const TIMEOUT_MS = 6000
const MAX_HTML = 512 * 1024
const MAX_IMAGE = 4 * 1024 * 1024
const MAX_REDIRECTS = 3
const UA = 'Mozilla/5.0 (compatible; BakeruNoteLinkPreview/1.0; +https://kanban-note01.vercel.app)'

const ALLOWED_ORIGIN = /^https:\/\/kanban-note01(-[a-z0-9-]+)?\.vercel\.app$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

function json(body: unknown, status = 200, origin?: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': status === 200 ? 'public, s-maxage=86400, stale-while-revalidate=604800' : 'no-store',
      ...(origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}),
    },
  })
}

// ---- 行き先の確認（内側のネットワークへは行かない） ----
function privateV4(ip: string) {
  const [a, b] = ip.split('.').map(Number)
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19))
}
function privateIp(ip: string) {
  if (isIP(ip) === 4) return privateV4(ip)
  const v6 = ip.toLowerCase()
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return privateV4(mapped[1])
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb') || v6.startsWith('ff')
}
async function checkTarget(raw: string): Promise<URL> {
  let u: URL
  try { u = new URL(raw) } catch { throw new Error('URL が正しくありません') }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('http と https だけ使えます')
  if (u.port && u.port !== '80' && u.port !== '443') throw new Error('このポートには行けません')
  if (u.username || u.password) throw new Error('ID やパスワード入りの URL は使えません')
  const host = u.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('内側のアドレスには行けません')
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error('内側のアドレスには行けません')
  return u
}

/** 転送を1回ずつ確かめながら取りに行く */
async function safeFetch(raw: string, accept: string, signal: AbortSignal): Promise<{ res: Response; url: URL }> {
  let url = await checkTarget(raw)
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(url, { redirect: 'manual', signal, headers: { 'user-agent': UA, accept, 'accept-language': 'ja,en;q=0.8' } })
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = await checkTarget(new URL(res.headers.get('location')!, url).href)
      continue
    }
    return { res, url }
  }
  throw new Error('転送が多すぎます')
}

/** 本文を上限まで読む（HTML は </head> まで読めば足りる） */
async function readLimited(res: Response, max: number, stopAtHead: boolean): Promise<Uint8Array> {
  const reader = res.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    size += value.length
    if (size >= max) { if (!stopAtHead) { await reader.cancel(); throw new Error('大きすぎます') } break }
    if (stopAtHead && new TextDecoder().decode(value).includes('</head>')) break
  }
  await reader.cancel().catch(() => {})
  const out = new Uint8Array(Math.min(size, max))
  let o = 0
  for (const c of chunks) { const n = Math.min(c.length, out.length - o); out.set(c.subarray(0, n), o); o += n; if (o >= out.length) break }
  return out
}

// ---- HTML から名刺を取り出す ----
const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const decode = (s: string) => s
  .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m)
  .replace(/\s+/g, ' ').trim()
function metaOf(html: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(2).find((x) => x !== undefined)
  const m = new Map<string, string>()
  for (const t of tags) {
    const key = (attr(t, 'property') ?? attr(t, 'name') ?? attr(t, 'itemprop'))?.toLowerCase()
    const val = attr(t, 'content')
    if (key && val && !m.has(key)) m.set(key, decode(val))
  }
  return m
}
function charsetOf(bytes: Uint8Array, contentType: string) {
  const fromHeader = contentType.match(/charset=([\w-]+)/i)?.[1]
  if (fromHeader) return fromHeader
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 4096))
  return head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ?? 'utf-8'
}

async function preview(raw: string, signal: AbortSignal) {
  // YouTube は公式の oEmbed から（タイトル・チャンネル名・サムネイル）
  const host = (() => { try { return new URL(raw).hostname.replace(/^www\./, '') } catch { return '' } })()
  if (host === 'youtu.be' || host.endsWith('youtube.com')) {
    await checkTarget(raw)
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(raw)}`, { signal, headers: { 'user-agent': UA } })
    if (r.ok) {
      const o = await r.json() as { title?: string; author_name?: string; thumbnail_url?: string }
      return { url: raw, title: o.title ?? '', description: o.author_name ? `${o.author_name} の動画` : '', image: o.thumbnail_url ?? '', site: 'YouTube' }
    }
  }
  const { res, url } = await safeFetch(raw, 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', signal)
  if (!res.ok) throw new Error(`サイトが ${res.status} を返しました`)
  const type = res.headers.get('content-type') ?? ''
  // 画像や PDF をそのまま指している URL
  if (!/html|xml/i.test(type)) {
    await res.body?.cancel().catch(() => {})
    return { url: url.href, title: decodeURIComponent(url.pathname.split('/').pop() || url.hostname), description: '', image: type.startsWith('image/') ? url.href : '', site: url.hostname.replace(/^www\./, '') }
  }
  const bytes = await readLimited(res, MAX_HTML, true)
  let html: string
  try { html = new TextDecoder(charsetOf(bytes, type)).decode(bytes) } catch { html = new TextDecoder().decode(bytes) }
  const m = metaOf(html)
  const title = m.get('og:title') ?? m.get('twitter:title') ?? decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
  const description = m.get('og:description') ?? m.get('twitter:description') ?? m.get('description') ?? ''
  const imgRaw = m.get('og:image') ?? m.get('og:image:url') ?? m.get('twitter:image') ?? m.get('twitter:image:src') ?? ''
  let image = ''
  try { image = imgRaw ? new URL(imgRaw, url).href : '' } catch { /* 使えない画像の URL */ }
  return { url: url.href, title: title.slice(0, 200), description: description.slice(0, 400), image, site: (m.get('og:site_name') ?? url.hostname.replace(/^www\./, '')).slice(0, 80) }
}

async function proxyImage(raw: string, signal: AbortSignal, origin: string) {
  const { res } = await safeFetch(raw, 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8', signal)
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok) { await res.body?.cancel().catch(() => {}); throw new Error(`画像を取れませんでした（${res.status}）`) }
  if (!/^image\/(png|jpe?g|gif|webp|avif|bmp)/i.test(type)) { await res.body?.cancel().catch(() => {}); throw new Error('画像ではありません') }
  const len = Number(res.headers.get('content-length') || 0)
  if (len > MAX_IMAGE) { await res.body?.cancel().catch(() => {}); throw new Error('画像が大きすぎます') }
  const bytes = await readLimited(res, MAX_IMAGE, false)
  return new Response(new Blob([bytes as BlobPart]), {
    headers: { 'content-type': type, 'cache-control': 'public, s-maxage=86400', 'access-control-allow-origin': origin, vary: 'Origin', 'x-content-type-options': 'nosniff' },
  })
}

export async function GET(request: Request) {
  // このアプリからの呼び出しだけ（同じ場所からの呼び出しは Origin が無いこともあるので Referer も見る）
  const origin = request.headers.get('origin') ?? (() => { try { return new URL(request.headers.get('referer') ?? '').origin } catch { return null } })()
  if (!origin || !ALLOWED_ORIGIN.test(origin)) return json({ error: 'このアプリからだけ使えます' }, 403)

  const q = new URL(request.url).searchParams
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const image = q.get('image')
    if (image) return await proxyImage(image, ctrl.signal, origin)
    const url = q.get('url')
    if (!url) return json({ error: 'url がありません' }, 400, origin)
    return json(await preview(url, ctrl.signal), 200, origin)
  } catch (e) {
    const msg = ctrl.signal.aborted ? '時間がかかりすぎたので止めました' : e instanceof Error ? e.message : '取得できませんでした'
    return json({ error: msg }, 422, origin)
  } finally {
    clearTimeout(timer)
  }
}
