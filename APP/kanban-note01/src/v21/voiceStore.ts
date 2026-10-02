import { createSignal } from 'solid-js'
import { deviceName } from './photoStore'
import { makeZip } from '../utils/zipStore'

// 会話ログの音声（2026-09-28 利用者: セリフごとに収録して再生する）。
// - 1つのセリフに1つの録音。録音はこの端末の IndexedDB に置く（クラウドへの共有は次の段階）
// - セリフには固定の id が無い（本文のテキストから毎回読み直す）ので、「セリフの文字＋同じ文字の何番目か」で結び付ける。
//   話者の名前は鍵に入れない（登場人物の名前を変えても録音が外れないように）
// - セリフを書き直したときは、入力欄を離れたときに録音を新しい文字へ付け替える（録音後に文字が変わった印を付ける）
// - どのセリフにも合わなくなった録音（別の端末・別のタブで書き換えたなど）は「合わない音声」として残し、行に付け直せる

export type VoiceClip = {
  key: string
  /** 作品|ページ|範囲 */
  scope: string
  hash: string
  occ: number
  name: string
  text: string
  mime: string
  durationMs: number
  createdAt: string
  device: string
  /** 録音したあとでセリフの文字が変わった */
  edited?: boolean
  /** 録音したときのセリフの文字（付け替えても変えない。実際に話した文） */
  recordedText?: string
}
type StoredClip = VoiceClip & { blob: Blob }

const DB_NAME = 'note-story-v21-voice'

/** 文字の指紋（FNV-1a 32bit） */
export function textHash(text: string) {
  let h = 0x811c9dc5
  for (const ch of text.trim()) {
    h ^= ch.codePointAt(0)!
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}
export const clipKey = (scope: string, hash: string, occ: number) => `${scope}|${hash}|${occ}`

/** セリフの並びから、各セリフの鍵を出す（同じ文字のセリフは何番目かで分ける） */
export function keysFor(scope: string, lines: Array<{ id: string; text: string }>) {
  const seen = new Map<string, number>()
  const out = new Map<string, { key: string; hash: string; occ: number }>()
  for (const l of lines) {
    const hash = textHash(l.text)
    const occ = seen.get(hash) ?? 0
    seen.set(hash, occ + 1)
    out.set(l.id, { key: clipKey(scope, hash, occ), hash, occ })
  }
  return out
}

// ── 置き場所（IndexedDB。使えない環境では、開いている間だけ覚える） ──────────
const memory = new Map<string, StoredClip>()
let dbPromise: Promise<IDBDatabase | null> | null = null
function db(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') { resolve(null); return }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const s = req.result.createObjectStore('clips', { keyPath: 'key' })
      s.createIndex('scope', 'scope')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
  return dbPromise
}
function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return db().then((d) => new Promise((resolve) => {
    if (!d) { resolve(undefined); return }
    const req = run(d.transaction('clips', mode).objectStore('clips'))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(undefined)
  }))
}
async function putClip(c: StoredClip) {
  const d = await db()
  if (!d) { memory.set(c.key, c); return }
  await tx('readwrite', (s) => s.put(c))
}
async function getClip(key: string): Promise<StoredClip | undefined> {
  const d = await db()
  if (!d) return memory.get(key)
  return tx('readonly', (s) => s.get(key) as IDBRequest<StoredClip>)
}
async function deleteStored(key: string) {
  const d = await db()
  if (!d) { memory.delete(key); return }
  await tx('readwrite', (s) => s.delete(key))
}
async function scopeClips(scope: string): Promise<StoredClip[]> {
  const d = await db()
  if (!d) return [...memory.values()].filter((c) => c.scope === scope)
  return (await tx('readonly', (s) => s.index('scope').getAll(scope) as IDBRequest<StoredClip[]>)) ?? []
}

// ── いま開いている範囲の録音（画面用。音そのものは再生するときに読む） ──────
const [clips, setClips] = createSignal<Map<string, VoiceClip>>(new Map())
export { clips }
let loadedScope = ''
const strip = ({ blob: _b, ...meta }: StoredClip): VoiceClip => meta

export async function loadVoiceScope(scope: string) {
  loadedScope = scope
  const list = await scopeClips(scope)
  if (loadedScope !== scope) return
  setClips(new Map(list.map((c) => [c.key, strip(c)])))
}
function remember(c: VoiceClip | null, removeKey?: string) {
  setClips((prev) => {
    const next = new Map(prev)
    if (removeKey) next.delete(removeKey)
    if (c && c.scope === loadedScope) next.set(c.key, c)
    return next
  })
}

let persistAsked = false
export async function saveVoice(scope: string, line: { hash: string; occ: number; name: string; text: string }, rec: { blob: Blob; mime: string; durationMs: number }) {
  const clip: StoredClip = {
    key: clipKey(scope, line.hash, line.occ), scope, hash: line.hash, occ: line.occ, name: line.name, text: line.text,
    recordedText: line.text, mime: rec.mime, durationMs: rec.durationMs, createdAt: new Date().toISOString(), device: deviceName(), blob: rec.blob,
  }
  await putClip(clip)
  remember(strip(clip))
  // ブラウザが容量不足で消さないよう、最初の保存で「消さないで」と頼む（断られても録音は残る）
  if (!persistAsked) { persistAsked = true; void navigator.storage?.persist?.().catch(() => false) }
  return strip(clip)
}
export async function deleteVoice(key: string) {
  await deleteStored(key)
  remember(null, key)
}
/** 録音を別のセリフへ付け替える（書き直した・合わない音声を付け直す）。行き先にもう録音があれば何もしない */
export async function moveVoice(fromKey: string, to: { scope: string; hash: string; occ: number; name: string; text: string }, opts: { edited?: boolean } = {}) {
  const toKey = clipKey(to.scope, to.hash, to.occ)
  if (fromKey === toKey || clips().has(toKey)) return false
  const c = await getClip(fromKey)
  if (!c) return false
  const next: StoredClip = { ...c, key: toKey, scope: to.scope, hash: to.hash, occ: to.occ, name: to.name, text: to.text, recordedText: c.recordedText ?? c.text, ...(opts.edited ? { edited: true } : {}) }
  await putClip(next)
  await deleteStored(fromKey)
  remember(strip(next), fromKey)
  return true
}
export async function voiceUrl(key: string): Promise<string | null> {
  const c = await getClip(key)
  return c ? URL.createObjectURL(c.blob) : null
}

// ── 録音 ─────────────────────────────────────────────
export const canRecord = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
function pickMime() {
  const list = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  for (const m of list) { try { if (MediaRecorder.isTypeSupported?.(m)) return m } catch { /* 無視 */ } }
  return ''
}
export type Recording = { stop: () => Promise<{ blob: Blob; mime: string; durationMs: number }>; cancel: () => void; level: () => number }

/** マイクで録り始める（マイクの許可を聞かれる）。声の大きさ（0〜1）も返す */
export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
  const mime = pickMime()
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data) }
  const started = performance.now()
  // 声の大きさ（見た目だけ。使えない環境では 0）
  const [level, setLevel] = createSignal(0)
  let raf = 0
  let ctx: AudioContext | null = null
  try {
    const AC = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
    if (AC) {
      ctx = new AC()
      const an = ctx.createAnalyser()
      an.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(an)
      const buf = new Uint8Array(an.fftSize)
      const tick = () => {
        an.getByteTimeDomainData(buf)
        let peak = 0
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128))
        setLevel(Math.min(1, peak / 64))
        raf = requestAnimationFrame(tick)
      }
      tick()
    }
  } catch { ctx = null }
  const release = () => {
    cancelAnimationFrame(raf)
    void ctx?.close().catch(() => {})
    stream.getTracks().forEach((t) => t.stop())
  }
  rec.start()
  return {
    level,
    cancel: () => { try { rec.stop() } catch { /* 無視 */ } release() },
    stop: () => new Promise((resolve) => {
      rec.onstop = () => {
        release()
        const type = rec.mimeType || mime || chunks[0]?.type || 'audio/webm'
        resolve({ blob: new Blob(chunks, { type }), mime: type, durationMs: Math.round(performance.now() - started) })
      }
      rec.stop()
    }),
  }
}

export const formatDuration = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── まとめて書き出し（ZIP: 音声ファイル＋voices.json）。将来 novelEngine へ納品するときに、本文と結び直せる情報を入れておく ──
export type VoiceLine = { lineNo: number; name: string; text: string; pillar: string; hash: string; occ: number; key: string }

const extOf = (mime: string) => (/mp4|aac|m4a/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : /wav/.test(mime) ? 'wav' : 'webm')
const pad = (n: number) => String(n).padStart(3, '0')

/** ある範囲（作品|ページ|範囲）の録音を ZIP にする。lines は書き出す時点のセリフの並び */
export async function buildVoicePack(opts: {
  scope: string
  title: { id: string; name: string }
  page: { id: string; title: string }
  range: string
  lines: VoiceLine[]
}): Promise<{ blob: Blob; count: number; manifest: unknown }> {
  const stored = await scopeClips(opts.scope)
  const byKey = new Map(stored.map((c) => [c.key, c]))
  const used = new Set<string>()
  const files: Array<{ name: string; data: Uint8Array }> = []
  const toBytes = async (b: Blob) => new Uint8Array(await b.arrayBuffer())
  const entry = (c: StoredClip, file: string, line: VoiceLine | null) => ({
    file,
    lineNo: line?.lineNo ?? null,
    speaker: line?.name ?? c.name,
    text: line?.text ?? c.text,
    pillar: line?.pillar ?? '',
    textHash: c.hash,
    occurrence: c.occ,
    recordedText: c.recordedText ?? c.text,
    textChangedAfterRecording: !!c.edited || (line ?? c).text.trim() !== (c.recordedText ?? c.text).trim(),
    mime: c.mime,
    durationMs: c.durationMs,
    recordedAt: c.createdAt,
    device: c.device,
    matched: !!line,
  })
  const voices = []
  for (const line of opts.lines) {
    const c = byKey.get(line.key)
    if (!c) continue
    used.add(c.key)
    const file = `voice/${pad(line.lineNo)}.${extOf(c.mime)}`
    files.push({ name: file, data: await toBytes(c.blob) })
    voices.push(entry(c, file, line))
  }
  const unmatched = []
  let n = 0
  for (const c of stored.filter((x) => !used.has(x.key)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    n += 1
    const file = `voice/unmatched_${pad(n)}.${extOf(c.mime)}`
    files.push({ name: file, data: await toBytes(c.blob) })
    unmatched.push(entry(c, file, null))
  }
  const manifest = {
    schema: 'note_story.voice_pack.v0.1',
    app: 'note_story_v21',
    exportedAt: new Date().toISOString(),
    title: opts.title,
    page: opts.page,
    range: opts.range,
    link: {
      note: 'セリフとの結び方: text の指紋（textHash）と、同じ文字のセリフの何番目か（occurrence）で結ぶ。話者名は使わない（名前を変えても外れない）。lineNo は書き出した時点のセリフの順番（1始まり）で、本文を書き換えるとずれる。novelEngine へ納品するときに、この情報から結び直す',
      textHashAlgorithm: 'FNV-1a 32bit（前後の空白を除いた文字の code point）を36進数で',
    },
    lineCount: opts.lines.length,
    voices,
    unmatched,
  }
  files.unshift({ name: 'voices.json', data: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) })
  return { blob: makeZip(files), count: voices.length + unmatched.length, manifest }
}
