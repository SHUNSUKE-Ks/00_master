// 会話ログのテキスト（`名前：「本文」` / `柱：` / `ト：`、空行区切り）を行単位の発言に分け、
// 編集した発言だけを書き戻す。触っていない部分は1文字も変えない（会話ログタブと同じデータを共有するため）。

export type TalkEntryKind = 'pillar' | 'direction' | 'dialogue' | 'note' | 'raw'

export type TalkEntry = {
  id: string
  kind: TalkEntryKind
  name: string
  text: string
  /** いまの見た目を書き戻した原文（未編集なら読み込んだ原文そのもの） */
  raw: string
  /** 次の発言までの改行（'' は末尾） */
  sep: string
}

export type ParsedTalkLog = { lead: string; entries: TalkEntry[] }

let seq = 0
export function newTalkEntryId() {
  seq += 1
  return `talk-${Date.now().toString(36)}-${seq}`
}

const PILLAR = /^柱[：:](.*)$/
const DIRECTION = /^ト[：:](.*)$/
const DIALOGUE = /^(.+?)\s*：「(.*)$/
/** V2.1 の備考（テキストブロック）。2行目以降は字下げして続ける */
const NOTE = /^備考[：:](.*)$/

type ParseOptions = { notes?: boolean }

export function parseTalkLog(src: string, opts: ParseOptions = {}): ParsedTalkLog {
  const startsEntry = (line: string) =>
    PILLAR.test(line) || DIRECTION.test(line) || DIALOGUE.test(line) || line.startsWith(':::') || (!!opts.notes && NOTE.test(line))
  const lines = src.split('\n')
  let i = 0
  while (i < lines.length && lines[i].trim() === '') i += 1
  if (i === lines.length) return { lead: src, entries: [] }
  const lead = '\n'.repeat(i)
  const entries: TalkEntry[] = []

  while (i < lines.length) {
    const start = i
    const line = lines[i]
    let kind: TalkEntryKind = 'raw'
    let name = ''
    let text = ''

    if (line.startsWith(':::')) {
      i += 1
      while (i < lines.length && lines[i].trim() !== ':::') i += 1
      if (i < lines.length) i += 1
      text = lines.slice(start, i).join('\n')
    } else if (opts.notes && NOTE.test(line)) {
      kind = 'note'
      const body = [line.match(NOTE)![1]]
      i += 1
      while (i < lines.length && /^\s+\S/.test(lines[i])) {
        body.push(lines[i].trimStart())
        i += 1
      }
      text = body.join('\n')
    } else if (PILLAR.test(line)) {
      kind = 'pillar'
      text = line.match(PILLAR)![1].trim()
      i += 1
    } else if (DIRECTION.test(line)) {
      kind = 'direction'
      text = line.match(DIRECTION)![1].trim()
      i += 1
    } else if (DIALOGUE.test(line)) {
      kind = 'dialogue'
      const m = line.match(DIALOGUE)!
      name = m[1].trim()
      const body = [m[2]]
      i += 1
      // 閉じ「」」が来るまで続き行（空行・次の発言が来たら、閉じ忘れとみなして止める）
      while (!body[body.length - 1].trimEnd().endsWith('」') && i < lines.length
        && lines[i].trim() !== '' && !startsEntry(lines[i])) {
        body.push(lines[i].trimStart())
        i += 1
      }
      const last = body.length - 1
      body[last] = body[last].trimEnd().replace(/」$/, '')
      text = body.join('\n')
    } else {
      i += 1
      while (i < lines.length && lines[i].trim() !== '' && !startsEntry(lines[i])) i += 1
      text = lines.slice(start, i).join('\n')
    }

    const raw = lines.slice(start, i).join('\n')
    let blanks = 0
    while (i + blanks < lines.length && lines[i + blanks].trim() === '') blanks += 1
    const atEnd = i + blanks >= lines.length
    const sep = atEnd ? '\n'.repeat(blanks) : '\n'.repeat(blanks + 1)
    i += blanks
    entries.push({ id: newTalkEntryId(), kind, name, text, raw, sep })
  }
  return { lead, entries }
}

export function renderTalkEntry(entry: Pick<TalkEntry, 'kind' | 'name' | 'text'>): string {
  if (entry.kind === 'pillar') return `柱：${entry.text}`
  if (entry.kind === 'direction') return `ト：${entry.text.replace(/\n+/g, ' ')}`
  if (entry.kind === 'note') {
    const [first, ...rest] = entry.text.split('\n')
    // 続き行は字下げで表す。空行は区切り（次の発言）と見分けられないので書き出さない
    return `備考：${first ?? ''}${rest.filter((line) => line.trim() !== '').map((line) => `\n   ${line}`).join('')}`
  }
  if (entry.kind === 'dialogue') {
    const prefix = `${entry.name}：「`
    const [first, ...rest] = entry.text.split('\n')
    // 続き行の字下げは会話ログタブ（dialogueIndent）と同じ幅にそろえる
    return `${prefix}${first ?? ''}${rest.map((line) => `\n${' '.repeat(prefix.length)}${line}`).join('')}」`
  }
  return entry.text
}

export function serializeTalkLog(log: ParsedTalkLog): string {
  return log.lead + log.entries.map((entry) => entry.raw + entry.sep).join('')
}

/** `名前：「…` で始まる行（＝セリフ）の数。会話のあるページを探すのに使う */
export function countDialogueLines(src: string) {
  return src.split('\n').filter((line) => DIALOGUE.test(line)).length
}

/** 1 Dialog ＝ 20文字 × 3行 の目安（2026-09-24 利用者の初期テスト条件） */
export const TALK_LINE_CHARS = 20
export const TALK_MAX_LINES = 3

export function talkMeasure(text: string) {
  const lines = text.split('\n')
  const chars = [...text.replace(/\n/g, '')].length
  const overLine = lines.some((line) => [...line].length > TALK_LINE_CHARS)
  return { lines: lines.length, chars, over: overLine || lines.length > TALK_MAX_LINES }
}

/** 話者の名前を付け替える（`旧名：「…」` → `新名：「…」`）。触らない行は1文字も変えない */
export function renameSpeaker(src: string, from: string, to: string): string {
  if (!src || !from || from === to || !src.includes(from)) return src
  const log = parseTalkLog(src, { notes: true })
  let changed = false
  for (const e of log.entries) {
    if (e.kind !== 'dialogue' || e.name !== from) continue
    e.name = to
    e.raw = renderTalkEntry(e)
    changed = true
  }
  return changed ? serializeTalkLog(log) : src
}
